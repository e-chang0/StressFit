# 캐싱 전후 실측 비교

측정일: 2026-11-03. [GitHub Actions 실행](https://github.com/e-chang0/StressFit/actions/runs/41576340418)

커밋: `8feef59379e70f889fbc16908a140ed28d0a5c9d`. 환경: linux/x64, Node.js v24.22.1.

## 평균과 개선률

| 측정 항목 | 캐시 미사용 평균 (3회) | 캐시 적중 평균 (3회) | 개선률 |
|---|---:|---:|---:|
| 의존성 준비 | 1.856초 | 1.153초 | 37.88% |
| 측정 구간 파이프라인 | 3.904초 | 2.880초 | 26.22% |
| 전체 verification job | 13.333초 | 8.000초 | 40.00% |

개선률 = (미사용 평균 − 적중 평균) ÷ 미사용 평균 × 100. 음수는 느려졌다는 뜻이다.

## 원시 표본

| 구분 | cache hit | 의존성 준비 (초) | 파이프라인 (초) | 전체 job (초) | 근거 |
|---|---|---:|---:|---:|---|
| uncached 1 | false | 1.749 | 3.916 | 10.000 | [job](https://github.com/e-chang0/StressFit/actions/runs/41576340418/job/125720602311) |
| uncached 2 | false | 2.207 | 4.128 | 13.000 | [job](https://github.com/e-chang0/StressFit/actions/runs/41576340418/job/125720602291) |
| uncached 3 | false | 1.611 | 3.668 | 17.000 | [job](https://github.com/e-chang0/StressFit/actions/runs/41576340418/job/125720602391) |
| cold 1 | false | 2.367 | 6.647 | 15.000 | [job](https://github.com/e-chang0/StressFit/actions/runs/41576340418/job/125720601017) |
| warm 1 | true | 1.393 | 3.328 | 9.000 | [job](https://github.com/e-chang0/StressFit/actions/runs/41576340418/job/125720694431) |
| warm 2 | true | 1.093 | 2.831 | 8.000 | [job](https://github.com/e-chang0/StressFit/actions/runs/41576340418/job/125720693867) |
| warm 3 | true | 0.972 | 2.482 | 7.000 | [job](https://github.com/e-chang0/StressFit/actions/runs/41576340418/job/125720694507) |

## 측정 범위와 재현 방법

- 하나의 커밋에서 동일한 Reusable Workflow와 Composite Action, 동일한 ubuntu-latest/Node.js 24를 사용했다. 캐시 사용 여부만 달리하고 lint·build·test는 매번 실행했다.
- 미사용 3개 job과 최초 저장 1개 job은 새 러너에서 실행한다. 설치는 러너 기본 npm 캐시의 영향을 피하려고 비어 있는 작업 폴더의 .npm-ci-cache를 사용한다.
- 최초 저장 job이 완료된 뒤 별도 러너의 적중 job 3개를 실행한다. 키에 run ID와 attempt를 넣어 이전 실행 캐시와 격리한다. 최초 저장은 미사용/적중 평균에서 제외한다.
- 캐시 적중·미적중 상태를 assert한다. 적중이 없으면 벤치마크를 실패 처리하고 성공한 적중 결과로 오인하지 않는다.
- 의존성 준비 시간에는 캐시 조회·복원과 미적중 시 npm ci가 포함된다. 적중 시 정확한 node_modules를 복원하고 npm ci는 생략한다.
- 측정 구간 파이프라인은 Node 설정부터 의존성 준비·lint·build·test까지다. checkout, 타이머 이전 액션 다운로드, post-job 캐시 저장, 아티팩트 업로드는 제외한다.
- 전체 job은 GitHub API의 started_at~completed_at으로 계산하여 checkout·액션 준비·post-job 처리까지 포함한다. 초 단위 API이므로 ms 측정보다 정밀도가 낮으며 큐 대기는 제외한다.
- Cache benchmark 워크플로우를 수동 실행하면 같은 실험을 재현한다. 기본 브랜치 반영 전에는 feature/workflow-optimization 또는 benchmark/** 브랜치에서 벤치마크 관련 파일을 변경해 실행할 수 있다.
- 워크플로우 Summary와 cache-benchmark-evidence 아티팩트에도 보고서·JSON을 남긴다.

## 변동과 한계

- 의존성 준비: 미사용 1.611~2.207초, 적중 0.972~1.393초
- 측정 구간 파이프라인: 미사용 3.668~4.128초, 적중 2.482~3.328초
- 전체 verification job: 미사용 10.000~17.000초, 적중 7.000~9.000초

3회 표본은 이 데모에서의 관측값이다. 공유 러너 부하·네트워크·압축/복원 시간에 영향을 받으며 다른 프로젝트의 개선률을 보장하지 않는다. 4→6개로 확장한 전체 Matrix의 총 소요 시간 감소로 해석하지 않는다.
