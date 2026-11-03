import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function parseMetric(log) {
  const match = String(log).match(/STRESSFIT_METRICS (\{[^\r\n]+\})/);
  if (!match) throw new Error('Job log contains no measured metrics');
  return JSON.parse(match[1]);
}
export function groupSamples(samples) {
  const groups = { uncached: [], cold: [], warm: [] };
  for (const sample of samples) {
    for (const field of ['dependencies_ms', 'pipeline_ms', 'job_ms']) {
      if (!Number.isFinite(sample[field]) || sample[field] <= 0) throw new Error(`Invalid ${field}`);
    }
    const group = !sample.cache_enabled ? 'uncached' : sample.cache_hit ? 'warm' : 'cold';
    groups[group].push(sample);
  }
  if (groups.uncached.length !== 3 || groups.warm.length !== 3 || groups.cold.length !== 1) throw new Error('Expected 3 uncached, 1 cold, and 3 warm samples');
  for (const field of ['sha', 'os', 'arch', 'node']) {
    if (new Set(samples.map(s => s[field])).size !== 1) throw new Error(`Mixed ${field} values`);
  }
  return groups;
}
const mean = (samples, field) => samples.reduce((sum, sample) => sum + sample[field], 0) / samples.length;
const seconds = value => (value / 1000).toFixed(3);
export function renderBenchmarkReport(evidence) {
  const groups = groupSamples(evidence.samples);
  const metrics = [['dependencies_ms', '의존성 준비'], ['pipeline_ms', '측정 구간 파이프라인'], ['job_ms', '전체 verification job']];
  const rows = metrics.map(([field, label]) => {
    const before = mean(groups.uncached, field);
    const after = mean(groups.warm, field);
    return `| ${label} | ${seconds(before)}초 | ${seconds(after)}초 | ${((before - after) / before * 100).toFixed(2)}% |`;
  });
  const details = Object.entries(groups).flatMap(([group, samples]) => samples.map((s, i) => `| ${group} ${i + 1} | ${s.cache_hit} | ${seconds(s.dependencies_ms)} | ${seconds(s.pipeline_ms)} | ${seconds(s.job_ms)} | [job](${s.job_url}) |`));
  const ranges = metrics.map(([field, label]) => `- ${label}: 미사용 ${seconds(Math.min(...groups.uncached.map(s => s[field])))}~${seconds(Math.max(...groups.uncached.map(s => s[field])))}초, 적중 ${seconds(Math.min(...groups.warm.map(s => s[field])))}~${seconds(Math.max(...groups.warm.map(s => s[field])))}초`);
  return `# 캐싱 전후 실측 비교\n\n측정일: ${evidence.date}. [GitHub Actions 실행](${evidence.run_url})\n\n커밋: \`${evidence.samples[0].sha}\`. 환경: ${evidence.samples[0].os}/${evidence.samples[0].arch}, Node.js ${evidence.samples[0].node}.\n\n## 평균과 개선률\n\n| 측정 항목 | 캐시 미사용 평균 (3회) | 캐시 적중 평균 (3회) | 개선률 |\n|---|---:|---:|---:|\n${rows.join('\n')}\n\n개선률 = (미사용 평균 − 적중 평균) ÷ 미사용 평균 × 100. 음수는 느려졌다는 뜻이다.\n\n## 원시 표본\n\n| 구분 | cache hit | 의존성 준비 (초) | 파이프라인 (초) | 전체 job (초) | 근거 |\n|---|---|---:|---:|---:|---|\n${details.join('\n')}\n\n## 측정 범위와 재현 방법\n\n- 하나의 커밋에서 동일한 Reusable Workflow와 Composite Action, 동일한 ubuntu-latest/Node.js 24를 사용했다. 캐시 사용 여부만 달리하고 lint·build·test는 매번 실행했다.\n- 미사용 3개 job과 최초 저장 1개 job은 새 러너에서 실행한다. 설치는 러너 기본 npm 캐시의 영향을 피하려고 비어 있는 작업 폴더의 .npm-ci-cache를 사용한다.\n- 최초 저장 job이 완료된 뒤 별도 러너의 적중 job 3개를 실행한다. 키에 run ID와 attempt를 넣어 이전 실행 캐시와 격리한다. 최초 저장은 미사용/적중 평균에서 제외한다.\n- 캐시 적중·미적중 상태를 assert한다. 적중이 없으면 벤치마크를 실패 처리하고 성공한 적중 결과로 오인하지 않는다.\n- 의존성 준비 시간에는 캐시 조회·복원과 미적중 시 npm ci가 포함된다. 적중 시 정확한 node_modules를 복원하고 npm ci는 생략한다.\n- 측정 구간 파이프라인은 Node 설정부터 의존성 준비·lint·build·test까지다. checkout, 타이머 이전 액션 다운로드, post-job 캐시 저장, 아티팩트 업로드는 제외한다.\n- 전체 job은 GitHub API의 started_at~completed_at으로 계산하여 checkout·액션 준비·post-job 처리까지 포함한다. 초 단위 API이므로 ms 측정보다 정밀도가 낮으며 큐 대기는 제외한다.\n- Cache benchmark 워크플로우를 수동 실행하면 같은 실험을 재현한다. 기본 브랜치 반영 전에는 feature/workflow-optimization 또는 benchmark/** 브랜치에서 벤치마크 관련 파일을 변경해 실행할 수 있다.\n- 워크플로우 Summary와 cache-benchmark-evidence 아티팩트에도 보고서·JSON을 남긴다.\n\n## 변동과 한계\n\n${ranges.join('\n')}\n\n3회 표본은 이 데모에서의 관측값이다. 공유 러너 부하·네트워크·압축/복원 시간에 영향을 받으며 다른 프로젝트의 개선률을 보장하지 않는다. 4→6개로 확장한 전체 Matrix의 총 소요 시간 감소로 해석하지 않는다.\n`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, output] = process.argv.slice(2);
  writeFileSync(output, renderBenchmarkReport(JSON.parse(readFileSync(input, 'utf8'))));
}
