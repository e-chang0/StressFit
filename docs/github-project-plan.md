# StressFit GitHub Project 운영 계획

## 프로젝트 목표

`StressFit Sprint Board`는 사용자의 스트레스 상태와 운동 여건을 반영한 맞춤 운동 추천 MVP를 2개 스프린트로 계획하고 추적한다.

- Project: https://github.com/users/e-chang0/projects/4
- Kanban Board: https://github.com/users/e-chang0/projects/4/views/1
- Sprint Metrics: https://github.com/users/e-chang0/projects/4/views/2
- Insights: https://github.com/users/e-chang0/projects/4/insights

## 칸반 흐름

| 상태 | 진입 조건 | 종료 조건 | WIP 권장 한도 |
|---|---|---|---:|
| Backlog | 요구사항과 가치가 확인됨 | 우선순위·크기·스프린트가 정해짐 | 제한 없음 |
| To Do | 인수 조건과 의존성이 확인됨 | 담당자가 작업을 시작함 | 5 |
| In Progress | 구현 중 | 코드·테스트가 PR로 제출됨 | 3 |
| Review | PR과 검증 자료가 준비됨 | 리뷰 승인 및 CI 통과 | 2 |
| Done | 완료 정의 충족 | 배포 또는 문서화 완료 | 제한 없음 |

모든 작업은 `Backlog → To Do → In Progress → Review → Done` 순으로 이동한다. 긴급 버그만 사유를 기록하고 단계를 건너뛸 수 있다.

## 라벨 체계

- 유형: `type: feature`, `type: bug`, `type: docs`, `type: chore`
- 영역: `area: frontend`, `area: backend`, `area: recommendation`, `area: data`, `area: devops`
- 우선순위: `priority: P0`, `priority: P1`, `priority: P2`, `priority: P3`
- 상태 보조: `status: triage`, `blocked`

GitHub Project의 `Story Points` 숫자 필드는 1, 2, 3, 5, 8의 피보나치 값만 사용한다.

## 마일스톤과 백로그

| Sprint | 기간 | 목표 | 계획 포인트 |
|---|---|---|---:|
| Sprint 1 — Core Recommendation | 2026-09-28 ~ 2026-10-04 | 설문부터 규칙 기반 추천까지 핵심 흐름 완성 | 21 |
| Sprint 2 — Tracking & Quality | 2026-10-05 ~ 2026-10-11 | 운동 기록·리포트·배포 품질 완성 | 21 |

| # | 백로그 항목 | 유형 | 영역 | 우선순위 | SP | Sprint | 초기 상태 |
|---:|---|---|---|---|---:|---|---|
| 1 | MVP 사용자 스토리와 성공 지표 정의 | docs | docs | P1 | 2 | Sprint 1 | Done |
| 2 | 시스템 아키텍처와 데이터 흐름 설계 | docs | backend | P1 | 3 | Sprint 1 | Done |
| 3 | React·FastAPI 개발 환경 구성 | chore | devops | P1 | 3 | Sprint 1 | In Progress |
| 4 | 사용자 상태 설문 UI 구현 | feature | frontend | P1 | 5 | Sprint 1 | To Do |
| 5 | 운동·설문 데이터 모델과 API 구현 | feature | backend | P1 | 5 | Sprint 1 | To Do |
| 6 | 규칙 기반 운동 추천 엔진 구현 | feature | recommendation | P1 | 3 | Sprint 1 | Backlog |
| 7 | 추천 결과·운동 가이드 화면 구현 | feature | frontend | P1 | 5 | Sprint 2 | Backlog |
| 8 | 운동 완료와 스트레스 변화 기록 | feature | backend | P1 | 5 | Sprint 2 | Backlog |
| 9 | 주간 스트레스·운동 리포트 구현 | feature | frontend | P2 | 5 | Sprint 2 | Backlog |
| 10 | 위험 신호 운동 제외 및 안내 강화 | feature | recommendation | P0 | 3 | Sprint 2 | Backlog |
| 11 | 핵심 사용자 흐름 통합 테스트 | chore | devops | P1 | 2 | Sprint 2 | Backlog |
| 12 | CI와 MVP 배포 파이프라인 구성 | chore | devops | P2 | 1 | Sprint 2 | Backlog |

## 완료 정의(Definition of Done)

- 인수 조건을 모두 충족하고 관련 테스트가 통과한다.
- 코드 리뷰 승인을 받고 기본 브랜치에 병합한다.
- 개인정보·건강정보를 로그에 남기지 않는지 확인한다.
- API 또는 사용자 동작이 바뀌면 문서를 갱신한다.
- Project의 상태, Story Points, Sprint, 시작일, 완료일을 갱신한다.

## 선택과제: Cycle Time, Velocity, Burndown 분석

### 1. Cycle Time

측정식은 `완료일 - 시작일`이다. Project의 `Start Date`와 `End Date`를 사용하며, 평균뿐 아니라 중앙값과 85백분위수를 함께 본다. 초기 설정 시점에는 기획 이슈 2개(합계 5 SP)를 완료 처리했으므로 표본이 작고 같은 날 등록된 데이터는 `< 1일`로 표시한다. 첫 스프린트 종료 후 최소 5개 완료 이슈가 쌓이면 병목 상태별 체류시간을 분석한다.

### 2. Velocity

Velocity는 스프린트 종료 시 `Done`인 Story Points 합계다.

| 구분 | 계획 | 현재 완료 | 달성률 |
|---|---:|---:|---:|
| Sprint 1 | 21 SP | 5 SP | 23.8% |
| Sprint 2 | 21 SP | 0 SP | 0% |

첫 두 스프린트는 팀의 기준 속도를 구하는 기간이다. 이후 계획량은 최근 3개 스프린트 실제 Velocity 평균의 80~100% 범위로 잡는다.

### 3. Burndown

Sprint 1은 21 SP에서 시작해 현재 16 SP가 남는다. 7일 스프린트의 이상 소진선은 하루 3 SP이다.

| 날짜 | 이상 잔여 SP | 현재 잔여 SP |
|---|---:|---:|
| 09-28 | 21 | 16 |
| 09-29 | 18 | - |
| 09-30 | 15 | - |
| 10-01 | 12 | - |
| 10-02 | 9 | - |
| 10-03 | 6 | - |
| 10-04 | 0 | - |

매일 `Done`으로 이동한 포인트를 차감한다. 실제선이 이상선보다 이틀 연속 위에 있으면 새 작업 착수를 멈추고 `In Progress`와 `Review` 항목을 우선 완료한다.

## Project Insights 구성

- `Work by Status`: 상태별 이슈 수(Backlog 7, To Do 2, In Progress 1, Review 0, Done 2)
- `Velocity by Sprint`: X축 Sprint, Y축 Story Points 합계, 상태별 그룹. Sprint 1은 21 SP 중 Done 5 SP, Sprint 2는 21 SP 중 Done 0 SP이다.
- `Burndown — Remaining Story Points`: 시간에 따른 Open/Completed Story Points 선 그래프. 현재 전체 42 SP 중 Open 37 SP, Completed 5 SP이다.
- `Cycle Time`: 완료 이슈를 대상으로 `Start Date`와 `End Date` 차이를 계산한다. 현재 완료 표본 2건은 같은 날 생성·완료되어 `< 1일`이며, 날짜 데이터가 누적되면 평균·중앙값·85백분위수를 비교한다.

초기 수치는 계획 수립 직후의 베이스라인이다. 실제 운영 중에는 이슈 상태와 날짜를 갱신해 Insights 차트와 이 문서의 표를 스프린트 종료마다 함께 업데이트한다.
