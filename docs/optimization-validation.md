# 최적화 과제 검증 기록

확인일: 2026-11-03 (KST). 설정 파일 작성과 실제 GitHub 실행 결과를 구분해 기록했다.

## 요구사항별 근거

| 요구사항 | 구현·검증 |
|---|---|
| Matrix 확장 | Ubuntu/Windows/macOS × Node.js 22/24, 총 6개 조합에서 lint·build·test 성공 |
| Reusable Workflow | 일반 CI의 6개 조합과 캐시 실험의 7개 표본이 reusable-ci.yml을 실제 호출 |
| Composite Action | 공통 Node 설정·정확한 의존성 캐시 복원·미적중 설치를 setup-node 액션으로 실행 |
| 캐싱 전후 시간 | 미사용 3회·최초 저장 1회·적중 3회 실측, 각 적중 여부 assert |
| 개선률 | 의존성 준비 37.88%, 검증 측정 구간 26.22% 단축. 원시 표본과 범위·한계를 보고서에 기록 |
| 브랜치·PR 조건 | PR 및 feature push에서는 검사만 실행하고 배포 생략 |
| 변경 파일 감지 | PR base/head, push before/after를 비교. 문서만 변경하면 검사와 배포 생략 |
| 실제 선택적 배포 | main 앱 변경 시 6개 검증 후 GitHub Pages 배포 성공 |
| 제출 링크 | 저장소에 구현·비교 보고서·원시 JSON·검증 실행 주소 포함 |

## 실제 실행

| 시나리오 | 결과 | 실행 |
|---|---|---|
| 캐시 실험 | 미사용 3개·최초 저장 1개·적중 3개·보고서 생성 모두 성공 | [41576340418](https://github.com/e-chang0/StressFit/actions/runs/41576340418) |
| PR의 앱/CI 변경 | 6개 환경 성공, 배포 skipped | [41576914493](https://github.com/e-chang0/StressFit/actions/runs/41576914493) |
| feature 브랜치 앱/CI 변경 | 6개 환경 성공, 배포 skipped | [41576906922](https://github.com/e-chang0/StressFit/actions/runs/41576906922) |
| feature 브랜치 문서만 변경 | verify와 deploy 모두 skipped, 변경 판단·요약 성공 | [41576738394](https://github.com/e-chang0/StressFit/actions/runs/41576738394) |
| main 앱 변경 | 6개 환경 및 Pages 배포 성공 | [41577055315](https://github.com/e-chang0/StressFit/actions/runs/41577055315) |

main 앱 배포의 커밋은 `e8f497f8942c0528a73793d1cc7791c5179be35e`다. 최적화 코드는 [PR #18](https://github.com/e-chang0/StressFit/pull/18)로 main에 병합됐다. [배포 사이트](https://e-chang0.github.io/StressFit/).

문서만 변경하는 이 검증 기록도 별도 PR과 main 실행으로 확인하고 그 링크를 추가한다. docs/ 변경은 앱 배포를 유발하지 않는다. 기존 커뮤니티용 Community Checks는 별도 워크플로우이므로 문서 변경에서도 실행될 수 있다.

## 로컬 및 단위 검증

- Windows, Node.js v24.14.1에서 npm run verify 통과.
- 기본 앱/빌드 테스트 9개, 변경 파일 판단 7개, 보고서 파싱·계산 3개, 기존 커뮤니티 자동화 12개로 총 31개 통과.
- actionlint v1.7.12로 전체 워크플로우 검사 통과. 공식 릴리스 ZIP은 공개 SHA-256 체크섬과 대조했다.
- 변경 파일 테스트는 문서/앱/테스트/워크플로우 분류, PR·push 비교 기준, 새 브랜치, 삭제·이름 변경·공백 경로를 확인한다.
- 성능 보고서 테스트는 표본 수, 환경 일치, 측정값 유효성과 개선률을 확인하며 적중 표본 누락은 실패 처리한다.

## 수치 해석

[실측 보고서](cache-performance-report.md)와 [원시 JSON](evidence/cache-benchmark.json)은 실험 커밋 `8feef59379e70f889fbc16908a140ed28d0a5c9d`의 결과다. 그 시점의 19개 테스트를 미사용/적중 양쪽에서 동일하게 실행했다. 이후 main의 커뮤니티 테스트 12개를 보존해 최종 31개로 통합했다. 6개 Matrix 전체의 총 실행 시간이 26.22% 줄었다는 뜻은 아니다.

전체 verification job의 관측 평균은 13.333→8.000초(40.00%)지만, 초 단위 GitHub API 시각과 공유 러너의 액션 준비·종료 시간도 포함한다. 캐시 효과를 설명할 때는 의존성 준비와 통제된 검증 구간의 수치를 우선 사용한다. 대기 시간을 삽입하거나 측정값을 임의로 만들지 않았다.

## 발표용 설명

> StressFit 추천 데모의 테스트 환경을 4개에서 6개로 늘리고, 검사 흐름과 환경 준비를 각각 재사용 워크플로우와 공통 액션으로 분리했습니다. 정확한 환경·의존성 키가 적중하면 설치를 생략합니다. 같은 코드로 캐시 미사용·최초 저장·적중을 구분해 측정한 결과 의존성 준비는 37.88%, 검증 구간은 26.22% 단축됐습니다. PR은 검사만 하고, main에서 앱 파일이 바뀐 경우에만 모든 검증 후 배포하며, 문서만 바뀌면 배포하지 않습니다.
