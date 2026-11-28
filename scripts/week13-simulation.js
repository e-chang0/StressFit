import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { variantFor } from '../src/features.js';
import { createTracker } from '../src/analytics.js';

const root = new URL('../docs/week13/', import.meta.url);
const plan = JSON.parse(await readFile(new URL('simulation-plan.json', root), 'utf8'));
const config = JSON.parse(await readFile(new URL('../config/flags.json', import.meta.url), 'utf8'));
if (!config.experiment.enabled || config.experiment.id !== plan.experimentId) throw new Error('A/B 실험 설정을 확인하세요');
const start = Date.parse(plan.startsAt);
const now = Date.now();
const day = Math.floor((now - start) / 86400000);
const dir = new URL('simulation/', root);
await mkdir(dir, { recursive: true });
let recorded = false;
if (day >= 0 && day < plan.days) {
  const filename = `day-${String(day + 1).padStart(2, '0')}.json`;
  const existing = await readdir(dir);
  if (!existing.includes(filename)) {
    const events = [];
    const assignments = [];
    for (const decision of plan.decisions) {
      const identity = { id: `persona-${decision.id.slice(1)}`, audience: 'general' };
      const variant = variantFor(identity.id, config.experiment);
      const memory = new Map();
      const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
      let sequence = 0;
      const tracker = createTracker({ storage, identity, experiment: config.experiment, variant,
        makeId: () => `simulation-${day + 1}-${decision.id}-${++sequence}` });
      tracker.exposure();
      if (decision.click) tracker.track('recommend_click');
      assignments.push({ persona: decision.id, variant, click: decision.click, reason: decision.reason });
      events.push(...tracker.list());
    }
    const data = { source: 'llm-persona-scripted-simulation', recordedAt: new Date().toISOString(), day: day + 1, assignments, events };
    await writeFile(new URL(filename, dir), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
    recorded = true;
  }
}
const ended = now >= start + plan.days * 86400000;
if (!recorded) {
  let previous = '';
  try { previous = await readFile(new URL('simulation-report.md', root), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous && (!ended || previous.includes('운영 기간 종료'))) {
    console.log('새로 기록할 날짜가 없습니다.');
    process.exit(0);
  }
}
const names = (await readdir(dir)).filter(name => /^day-\d\d\.json$/.test(name)).sort();
const days = await Promise.all(names.map(async name => JSON.parse(await readFile(new URL(name, dir), 'utf8'))));
const rows = [];
for (const [label, first, last] of [['1주차', 1, 7], ['2주차', 8, 14]]) {
  const selected = days.filter(item => item.day >= first && item.day <= last);
  for (const variant of ['A', 'B']) {
    const entries = selected.flatMap(item => item.assignments).filter(item => item.variant === variant);
    const clicks = entries.filter(item => item.click).length;
    rows.push(`| ${label} | ${variant} | ${selected.length} | ${entries.length} | ${clicks} | ${entries.length ? (100 * clicks / entries.length).toFixed(1) + '%' : '자료 없음'} |`);
  }
}
const finished = ended;
const complete = finished && days.length === plan.days;
const elapsedDays = Math.max(0, Math.min(plan.days, day));
const missing = Array.from({ length: elapsedDays }, (_, i) => i + 1).filter(n => !days.some(item => item.day === n));
const report = `# 가상 페르소나 A/B 집계\n\n생성 시각: ${new Date().toISOString()}\n\n기간: ${plan.startsAt} ~ ${new Date(start + plan.days * 86400000).toISOString()} (UTC, 종료 시각 제외). 기록된 날짜: ${days.length}/14. 이미 지난 날짜 중 누락: ${missing.length ? missing.join(', ') : '없음'}. ${finished ? '운영 기간 종료' : '운영 중'}\n\n| 기간 | 그룹 | 기록된 일수 | 노출 횟수 | 클릭 횟수 | 클릭률 |\n|---|---|---:|---:|---:|---:|\n${rows.join('\n')}\n\n각 일자의 10개 노출은 실제 사람이 아니라 같은 10개 가상 페르소나의 반복 실행이다. LLM이 사전에 한 번 정한 클릭 판단을 반복하므로 매일 새로운 LLM 응답을 수집한 것이 아니다. 반복된 값은 독립적인 사용자나 새로운 피드백이 아니며, 클릭률 차이는 실제 사용자의 선호나 효과를 보여주지 않는다.\n\n## 결정\n\n${complete ? '시뮬레이션 방식에 대한 Pivot: 같은 가상 판단을 반복한 지표만으로 버튼 효과를 판단할 수 없으므로 실제 사용자 또는 매회 별도로 생성한 응답을 수집하는 방식으로 바꾼다. 제품 자체의 효과는 판단 보류.' : '보류: 14일이 지나고 기록의 누락 여부를 확인한 뒤 판단한다.'}\n`;
await writeFile(new URL('simulation-report.md', root), report);
console.log(report);
