import { readFile, readdir, writeFile } from 'node:fs/promises';

const dir = new URL('../docs/week13/events/', import.meta.url);
const files = (await readdir(dir)).filter(name => name.endsWith('.json')).sort();
const seen = new Set();
const events = [];
for (const file of files) {
  const data = JSON.parse(await readFile(new URL(file, dir), 'utf8'));
  if (data.source !== 'browser-local' || !Array.isArray(data.events)) throw new Error(`${file}: 브라우저 내보내기 형식이 아닙니다`);
  for (const event of data.events) {
    if (event.schemaVersion !== 1 || !event.eventId || !event.userId || !['A', 'B'].includes(event.variant) || !Number.isFinite(Date.parse(event.timestamp))) throw new Error(`${file}: 잘못된 이벤트`);
    if (!seen.has(event.eventId)) { seen.add(event.eventId); events.push(event); }
  }
}
const experiment = 'recommendation-cta-v1';
const byUser = new Map();
for (const e of events.filter(e => e.experimentId === experiment).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))) {
  const previous = byUser.get(e.userId);
  if (previous && previous.variant !== e.variant) throw new Error('한 ID의 실험 그룹이 서로 다릅니다');
  if (e.event === 'experiment_exposure' && !previous) byUser.set(e.userId, { variant: e.variant, exposedAt: Date.parse(e.timestamp), clicked: false });
  else if (previous && e.event === 'recommend_click' && Date.parse(e.timestamp) >= previous.exposedAt) previous.clicked = true;
}
const rows = ['A', 'B'].map(variant => {
  const users = [...byUser.values()].filter(user => user.variant === variant);
  const clicks = users.filter(user => user.clicked).length;
  return `| ${variant} | ${users.length} | ${clicks} | ${users.length ? (100 * clicks / users.length).toFixed(1) + '%' : '자료 없음'} |`;
});
const report = `# A/B 실험 집계\n\n생성 시각: ${new Date().toISOString()}\n\n실험: ${experiment}. 브라우저에서 내보낸 파일 ${files.length}개를 합쳤습니다. 이벤트 ID로 중복을 제외하고, 노출 이후 추천 버튼을 한 번 이상 누른 ID를 셉니다. 클릭률은 사람 수가 아닌 브라우저 ID 기준이며, 파일의 데이터 출처와 수집 기간은 별도로 확인해야 합니다.\n\n| 그룹 | 노출 ID | 클릭 ID | 클릭률 |\n|---|---:|---:|---:|\n${rows.join('\n')}\n\n${files.length ? '파일에 있는 전체 기간을 집계합니다. 2주차 결과로 제출하기 전 이벤트 시각과 자료 출처를 확인하세요.' : '아직 가져온 이벤트 파일이 없어 비교할 수 없습니다.'}\n`;
await writeFile(new URL('../docs/week13/latest-report.md', import.meta.url), report);
console.log(report);
