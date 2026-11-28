import { readFile, writeFile } from 'node:fs/promises';
import { variantFor } from '../src/features.js';

const root = new URL('../docs/week13/', import.meta.url);
const plan = JSON.parse(await readFile(new URL('simulation-plan.json', root), 'utf8'));
const config = JSON.parse(await readFile(new URL('../config/flags.json', import.meta.url), 'utf8'));
if (!config.experiment.enabled || config.experiment.id !== plan.experimentId) throw new Error('실험 설정이 예상과 다릅니다.');
const participants = plan.decisions.map(item => ({ persona: item.id,
  variant: variantFor(`persona-${item.id.slice(1)}`, config.experiment),
  click: item.click, reason: item.reason }));
const groups = ['A', 'B'].map(variant => {
  const users = participants.filter(item => item.variant === variant);
  const clicked = users.filter(item => item.click).length;
  return { variant, personas: users.length, clicked, projectedWeeklyExposures: users.length * 7,
    projectedWeeklyClicks: clicked * 7, rate: users.length ? clicked / users.length : null };
});
const result = { type: 'accelerated-projection-not-observed-14-day-operation', calculatedAt: new Date().toISOString(),
  method: 'LLM이 사전에 정한 가상 인물 10명의 클릭 판단을 각 가상 날짜에 그대로 반복하는 산술 계산',
  limitation: '미래의 관찰값이나 실제 2주 운영 기록이 아니다. 반복은 새 표본이나 피드백을 만들지 않는다.', participants, groups };
await writeFile(new URL('forecast.json', root), JSON.stringify(result, null, 2) + '\n');
const rows = groups.map(g => `| ${g.variant} | ${g.personas} | ${g.clicked} | ${g.projectedWeeklyExposures} | ${g.projectedWeeklyClicks} | ${g.rate === null ? '자료 없음' : (g.rate * 100).toFixed(1) + '%'} |`);
const text = `# 14일 가상 계산과 잠정 결정\n\n계산 시각: ${result.calculatedAt}\n\n**이 문서는 하루에 계산한 예측이다. 실제로 14일 동안 운영하거나 미래의 결과를 관찰한 기록이 아니다.** 실제로 쌓인 날짜별 결과는 [실험 집계](simulation-report.md)에 따로 기록한다.\n\n## 방법\n\n기존 Feature Flag의 배정 함수로 가상 인물 10명을 A/B에 배정하고, LLM이 한 번 작성한 각 인물의 클릭 여부를 14개의 가상 날짜에 그대로 반복한다고 가정했다. 세부 판단은 [원본 계획](simulation-plan.json), 계산 결과는 [JSON](forecast.json)에 있다. 새로운 LLM 응답은 만들지 않았다.\n\n1주차와 2주차는 같은 계산이므로 각각 아래 수치가 나온다.\n\n| 그룹 | 서로 다른 가상 인물 | 클릭 판단 인물 | 주당 가상 노출 횟수 | 주당 가상 클릭 횟수 | 가상 클릭률 |\n|---|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n\n같은 인물과 판단을 매일 반복하므로 노출 횟수는 독립적인 사용자 수가 아니다. 1주차에서 2주차로 변하는 값은 없으며, 이는 코드에 같은 답을 반복하도록 정했기 때문이다. 두 그룹은 인원도 다르고 같은 인물이 두 문구를 평가하지 않았으므로 문구의 효과를 구분할 수 없다. 실제 이용자의 클릭률이나 통계적 차이로 해석할 수 없다.\n\n## 잠정 결정: 실험 방식 Pivot\n\n버튼 B의 클릭률이 A보다 5%p 높아진다는 가설을 현재 자료로 확인할 수 없다. 같은 응답의 반복 대신 매번 별도로 생성한 페르소나 응답을 보관하고, 가능하면 실제 사용자의 익명 반응도 모으는 방식으로 다음 실험을 바꾼다. 제품을 계속할지 바꿀지는 판단 보류다.\n\n이 결정은 사전에 계산한 시뮬레이션에 대한 잠정 판단이다. 진행 중인 14일 기록이 완료되면 누락과 실제 기록 시각을 확인하고 결과와 결정이 달라지는지 다시 검토한다. 과제의 ‘2주 운영’ 요건을 이 예측 문서만으로 충족했다고 주장하지 않는다.\n`;
await writeFile(new URL('forecast.md', root), text);
console.log(text);
