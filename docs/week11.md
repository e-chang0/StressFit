# 11주차 · Feature Flags 및 점진적 배포 실습

## 제출 링크

- 웹사이트: https://e-chang0.github.io/StressFit/
- 실습실: https://e-chang0.github.io/StressFit/lab.html
- GitHub: https://github.com/e-chang0/StressFit
- 플래그 코드: [src/features.js](../src/features.js), [환경 변수 해석](../scripts/flag-config.js), [기본 설정](../config/flags.json)
- 실험 로그: [experiments.json](evidence/week11/experiments.json)
- 롤아웃 설정: [config/rollout.json](../config/rollout.json)
- HTTP 검증 로그: [canary.json](evidence/week11/canary.json)
- CI: [Week 11 flags and Canary evidence](https://github.com/e-chang0/StressFit/actions/workflows/week11.yml)

웹사이트 링크는 main의 Pages 배포 완료 후 사용한다. 실험 로그의 `scripted-core-verification`은 가상 사용자로 공통 모듈을 실제 실행한 기록이다. 실제 서비스 사용자 통계로 해석하지 않는다. 실습실에서 직접 만든 브라우저 이벤트는 JSON 내려받기로 별도 제출할 수 있다.

## 필수 과제 구현

| 플래그 | 빌드 환경 변수 | 일반 사용자 | 베타 사용자 | 화면 변화 |
|---|---|---|---|---|
| `newResultCard` | `FF_NEW_RESULT_CARD` | ON | ON | 새 추천 카드, 목표 배지 |
| `detailedReason` | `FF_DETAILED_REASON` | OFF | ON | 추천 원리와 실천 설명 추가 |
| `completionLog` | `FF_COMPLETION_LOG` | ON | ON | 완료 버튼·브라우저 내 완료 횟수 |

표는 기본 설정, 기능 롤아웃 100% 기준이다. 각 환경 변수가 `false`이면 대상 사용자도 해당 기능을 사용할 수 없다. 평가 순서는 환경 ON 여부 → 사용자 그룹 포함 여부 → ID 기반 롤아웃 비율이다. 통증 시 휴식·전문가 상담 안내는 상세 설명 플래그와 무관하게 항상 표시한다.

`APP_ENV`는 표시할 환경 이름이며 이름만 바꿔도 플래그가 바뀌지는 않는다. 환경별 플래그 값은 `FF_*`로 명시한다. `FF_ROLLOUT_PERCENT`는 0~100 정수, `AB_ENABLED`는 `true`/`false`만 허용한다. 잘못된 값은 빌드를 실패시킨다. 실습실의 ON/OFF 미리보기는 비교 화면에만 영향을 주며 배포 설정이나 추천 화면을 덮어쓰지 않는다.

## 환경 변수로 실제 토글하기

Node.js 22.13 이상에서:

```sh
npm ci
npm run verify
npm run evidence
npm run preview
```

PowerShell은 실행 정책으로 `npm.ps1`이 막힐 경우 `npm.cmd`를 사용한다.

`.env.example`을 `.env`로 복사하고 예를 들어 세 기능을 모두 끈다:

```dotenv
APP_ENV=staging
FF_NEW_RESULT_CARD=false
FF_DETAILED_REASON=false
FF_COMPLETION_LOG=false
FF_ROLLOUT_PERCENT=100
AB_ENABLED=true
```

```sh
node --env-file=.env scripts/build.js
npm run preview
```

기본 주소는 http://127.0.0.1:4173 이다. 빌드는 기본값과 지정한 환경 변수만 `dist/config.json`에 기록한다. `.env`는 자동으로 로드되지 않으며 위 명령에서만 읽는다. 전체 환경 변수나 비밀 값은 산출물에 복사하지 않는다. 기존 셸에 같은 이름의 변수가 있다면 Node의 기존 환경 값이 우선하므로 확인한다. 기본 설정으로 복원하려면 환경 변수를 해제하고 `.env` 옵션 없이 다시 빌드한다.

GitHub Pages에서는 저장소 Actions Variables의 같은 이름을 CI 빌드에 전달한다. 기본값은 워크플로우에 명시돼 있다. 변수 변경 후 `StressFit CI/CD`를 수동 실행하면 앱 변경이 없어도 설정을 다시 빌드·배포한다. 정적 호스팅이므로 환경 변수 변경은 재배포 후 반영된다. 코드 변경은 기존 변경 파일 감지와 검증·배포 경로를 이용한다.

## A/B 할당과 이벤트

- 실험 ID: `recommendation-cta-v1`
- A: **내 루틴 확인하기 →**
- B: **나에게 맞는 루틴 찾기 →**
- 사용자 ID와 실험 ID를 FNV-1a 기반 정수 해시로 계산하여 0~4999는 A, 5000~9999는 B로 할당한다. 랜덤 재할당을 하지 않아 같은 ID·실험 ID는 새로고침과 그룹 변경 후에도 같다. 다른 ID가 반드시 다른 variant를 받는 것은 아니다.
- 자동 생성한 익명 ID와 실습 그룹은 `localStorage`에 저장한다. 다른 브라우저·시크릿 창·저장소 초기화 시 새 ID가 생성된다. 저장이 차단되면 화면은 동작하지만 페이지 간 사용자 일관성과 영구 로그는 보장되지 않는다.
- 실험 OFF는 기본 A 버튼을 표시하고 노출 이벤트를 남기지 않는다. 다른 이벤트의 실험 ID·variant는 `null`로 구분한다.
- 기록: `experiment_exposure`, `recommend_click`, `recommend_success`, `recommend_error`, `routine_complete`.
- 이벤트에는 고유 ID, ISO 시각, 익명 사용자 ID, 그룹, 실험 ID, variant를 넣는다. 건강 입력값은 기록하지 않는다. 노출은 보관 중인 로그에서 사용자·실험 ID별 중복을 방지한다. 로그를 비우거나 500건 제한으로 노출 기록이 밀려난 뒤에는 다음 방문에서 다시 노출을 기록할 수 있다.
- 최근 500건을 브라우저에 저장하며 실습실에서 최근 30건과 집계를 확인하고 전체 JSON을 내려받는다. 중앙 수집·다중 기기 분석은 이번 범위에 포함하지 않는다. 여러 탭의 순차 쓰기는 최신 저장 로그를 읽어 합치며, 동시에 발생한 쓰기에 대한 트랜잭션 보장은 없다.
- 브라우저에서 그룹을 선택하는 기능은 대상 사용자 시연용이다. 실제 서비스의 권한 판정 용도로 쓰지 않는다.

## 선택과제 · Canary 검증

GitHub Pages에는 정적 웹앱을 배포한다. 웹 실습실에서는 샘플 지표를 공통 제어 모듈에 전달하는 시뮬레이션을 실행한다. 실제 HTTP 검증은 `npm run evidence`가 로컬·CI의 임의 포트에서 stable, candidate, gateway 서버 세 개를 시작하여 수행한다. 외부 계정과 유료 서비스는 필요 없다.

1. gateway는 사용자 ID 해시로 candidate 트래픽을 **1% → 10% → 50% → 100%**로 늘린다. 같은 ID의 버전 선택은 같은 비율에서 고정되고 이전 단계의 대상은 다음 단계에도 포함된다.
2. 단계마다 gateway에 가상 사용자 1,000명의 실제 HTTP 요청을 보내 버전과 분배를 검증한다. 비율은 확률적 사용자 배정이므로 유한 표본에서 정확히 일치하지 않는다. 원본 로그의 candidate 건수는 13/117/488/1000이다.
3. 1% 단계의 표본 부족을 피하기 위해 후보 서버에도 직접 100회 요청하고 오류율과 p95 응답 시간을 측정한다. `/health` 응답·버전도 확인한다. 트래픽 분배 검증과 후보 상태 측정 표본은 로그에서 구분한다.
4. `/health` 정상, 표본 ≥100, 오류율 ≤2%, p95 ≤250ms일 때 다음 단계로 승격한다. HTTP 요청은 2초 후 타임아웃 처리한다. 헬스 실패·관측 예외·부족한 지표·오류율/지연 초과 시 즉시 후보 비율을 0%로 되돌린다.
5. 실패 시나리오에서는 10% 단계에서 후보 서버가 실제 HTTP 503을 반환하도록 장애를 주입한다. 안정 버전은 계속 정상 응답한다. 제어기가 자동으로 0%로 복원하고 이후 50%·100% 단계는 실행하지 않는다.
6. 승격·롤백 후 gateway에 다시 100회 요청하여 정상 응답과 활성 버전을 확인한다. 롤백 후 100건 모두 `stable-v1`임을 assert한다. 검사 실패 시 명령과 CI가 실패한다.

운영 서버의 인프라 배포·운영 트래픽 분할·클라우드 배포 복원은 구현 범위가 아니다. 로컬 HTTP 실습은 버전 응답 서버와 gateway를 사용하며 운동 앱의 두 서버 버전을 실제 배포하는 구성은 아니다. [PR #20](https://github.com/e-chang0/StressFit/pull/20)에서 추가한 Netlify/Render 연결은 이 과제에 필요하지 않으며, 기존 헬스체크와 컨테이너 구성을 보존했다.

## 웹 시연 순서

1. 실습실에서 익명 ID를 정하고 일반 그룹을 저장한다. 기능 목록은 새 카드 ON / 상세 설명 OFF / 완료 기록 ON이다.
2. 추천 화면에서 추천을 받고 완료 버튼을 누른다. 실습실로 돌아와 노출·클릭·성공·완료 이벤트와 variant를 확인한다.
3. 같은 ID를 베타 그룹으로 저장하면 상세 설명도 ON이다. 추천 화면에서 추가 설명을 확인한다. 새로고침 후 버튼 variant가 유지되는지 확인한다.
4. 다른 ID로 같은 과정을 반복해 A/B 두 버튼을 확인한다. 배정은 ID별 해시이므로 필요하면 ID 숫자를 바꾼다.
5. 이벤트 JSON을 내려받는다. 기능 OFF는 플래그 비교에서 확인하고 실제 화면 OFF는 위 환경 변수 빌드로 재현한다.
6. 정상 Canary 버튼에서 네 단계 PASS·100% 승격을 확인한다. 장애 주입 버튼에서 10% FAIL·0% 자동 롤백을 확인하고 JSON을 내려받는다.
7. GitHub의 실험 로그·HTTP 검증 로그·설정·CI artifact를 함께 확인한다.

## 검증 기록

- 2026-11-28 (한국 시간): lint, build 및 자동 테스트 통과.
- `npm run evidence`: 일반/베타 × A/B 네 프로필, 16개 공통 모듈 이벤트 생성, 할당 유지·환경 OFF 검증.
- HTTP 정상 승격 네 단계와 10% 장애 시 안정 버전 복원 검증 통과. 실행 시각과 실측 지연은 JSON에 기록된다.
- 로컬 Chrome: 새 추천 카드, 완료 횟수 증가, 일반/베타 대상 전환, 브라우저 이벤트 표시, 자동 롤백 시뮬레이션 확인.
