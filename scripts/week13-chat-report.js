import { readFile, writeFile } from 'node:fs/promises';
import { variantFor } from '../src/features.js';
import { createTracker } from '../src/analytics.js';

const root = new URL('../docs/week13/', import.meta.url);
const input = JSON.parse(await readFile(new URL('chat-responses.json', root), 'utf8'));
const config = JSON.parse(await readFile(new URL('../config/flags.json', import.meta.url), 'utf8'));
if (!config.experiment.enabled) throw new Error('A/B 실험이 꺼져 있습니다.');
const seen = new Set();
const events = [];
for (const item of input.responses) {
  const key = `${item.week}-${item.persona}`;
  if (seen.has(key) || ![1, 2].includes(item.week) || !/^P\d\d$/.test(item.persona) || typeof item.click !== 'boolean') throw new Error(`잘못된 응답: ${key}`);
  seen.add(key);
  const identity = { id: `persona-${item.persona.slice(1)}`, audience: 'general' };
  const variant = variantFor(identity.id, config.experiment);
  if (variant !== item.shown) throw new Error(`배정 문구 불일치: ${key}`);
  const memory = new Map();
  const storage = { getItem: k => memory.get(k) ?? null, setItem: (k, value) => memory.set(k, value) };
  let sequence = 0;
  const tracker = createTracker({ storage, identity, variant, experiment: config.experiment,
    makeId: () => `chat-${key}-${++sequence}` });
  tracker.exposure();
  if (item.click) tracker.track('recommend_click');
  events.push(...tracker.list().map(event => ({ ...event, simulatedWeek: item.week })));
}
if (seen.size !== 20) throw new Error('각 회차에 10개 응답이 필요합니다.');
const rows = [];
const values = {};
for (const week of [1, 2]) {
  for (const variant of ['A', 'B']) {
    const assigned = input.responses.filter(item => item.week === week && item.shown === variant);
    const clicks = assigned.filter(item => item.click).length;
    const pct = assigned.length ? 100 * clicks / assigned.length : null;
    values[`${week}${variant}`] = pct;
    rows.push(`| 가상 ${week}주차 | ${variant} | ${assigned.length} | ${clicks} | ${pct === null ? '자료 없음' : pct.toFixed(1) + '%'} |`);
  }
}
const result = { source: 'chat-batch-synthetic', generatedAt: new Date().toISOString(), experimentId: config.experiment.id, events };
await writeFile(new URL('chat-events.json', root), JSON.stringify(result, null, 2) + '\n');
const diff = (a, b) => a === null || b === null ? '계산 불가' : `${(a - b).toFixed(1)}%p`;
const report = `# 대화에서 진행한 압축 모의 A/B 실험\n\n생성 시각: ${result.generatedAt}\n\n**이 결과는 한 번의 대화 응답에서 작성한 가상 평가다. 실제 사용자 조사나 2주 동안 운영한 기록은 아니다.** 가상 1·2주차는 시간 경과를 앞당겨 비교하기 위해 붙인 회차 이름이다. [가상 응답과 상황](chat-responses.json) · [이벤트 기록](chat-events.json)\n\n## 방법\n\n가상 인물 10명을 기존 recommendation-cta-v1 플래그의 배정 함수로 A 7명, B 3명에 고정했다. A 문구는 '내 루틴 확인하기 →', B 문구는 '나에게 맞는 루틴 찾기 →'다. 이 대화에서 한 LLM이 각 회차의 상황에 따라 20개 클릭 여부와 이유를 한 번에 작성했다. 별도의 독립된 API 호출 20회가 아니다. 응답을 기존 추적 함수로 전달해 노출과 클릭 이벤트를 만들었다. 두 회차는 같은 페르소나를 다시 사용한다.\n\n| 회차 | 그룹 | 가상 노출 | 클릭 판단 | 클릭률 |\n|---|---|---:|---:|---:|\n${rows.join('\n')}\n\n- 2주차와 1주차의 클릭률 차이: A ${diff(values['2A'], values['1A'])}, B ${diff(values['2B'], values['1B'])}.\n- 같은 주차에서 B와 A의 차이: 가상 1주차 ${diff(values['1B'], values['1A'])}, 가상 2주차 ${diff(values['2B'], values['2A'])}.\n\n## 잠정 결정: 실험 방법 Pivot\n\n버튼 B가 A보다 클릭률을 5%p 이상 높인다는 원래 가설은 이 자료로 확인할 수 없다. 그룹이 7명과 3명으로 작고, 같은 가상 인물을 두 번 쓰며, 각 회차의 상황도 달라졌다. 한 LLM이 모든 응답을 함께 작성했기 때문에 응답 사이의 편향도 있을 수 있다. 이 숫자를 실제 사용자의 행동이나 버튼 문구의 효과로 해석하지 않는다.\n\n다음 실험에서는 더 많은 실제 참여자를 모집하거나, 모집이 불가능하면 독립된 LLM 호출과 균형 잡힌 조건으로 가상 평가를 수집한다. 제품 방향의 Pivot 또는 Persevere는 판단 보류다. 실제 예정된 14일 기록은 별도로 진행하며, 이 압축 모의 실험이 과제의 실제 2주 운영 요건을 대신 충족한다고 주장하지 않는다.\n`;
await writeFile(new URL('chat-report.md', root), report.replaceAll('\u0000', '`'));
console.log(report.replaceAll('\u0000', '`'));
