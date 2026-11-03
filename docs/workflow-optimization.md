# 워크플로우 실행 최적화

## 제출 링크

- [StressFit 저장소](https://github.com/e-chang0/StressFit)
- [최적화 전 워크플로우](https://github.com/e-chang0/StressFit/blob/20be27ebba882d8d6195739a3bf2a33c43500aaf/.github/workflows/ci-cd.yml)
- [최적화 후 워크플로우](../.github/workflows/ci-cd.yml)
- [Reusable Workflow](../.github/workflows/reusable-ci.yml)
- [Composite Action](../.github/actions/setup-node/action.yml)
- [캐시 벤치마크](../.github/workflows/cache-benchmark.yml)
- [Actions 실행 목록](https://github.com/e-chang0/StressFit/actions)

- [캐싱 전후 실측 비교 리포트](cache-performance-report.md): 의존성 준비 37.88%, 측정 구간 파이프라인 26.22% 단축
- [실측 원시 JSON](evidence/cache-benchmark.json)
- [실측 실행 및 자동 생성 보고서](https://github.com/e-chang0/StressFit/actions/runs/41576340418)
- [구현 PR #18](https://github.com/e-chang0/StressFit/pull/18)

전체 verification job 평균도 13.333초에서 8.000초로 40.00% 줄었지만, 공유 러너의 액션 준비 시간 등도 포함하므로 캐시만의 효과로 단정하지 않는다. 통제된 비교 구간과 원시 표본은 실측 리포트를 참고한다.

## 전후 비교

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| Matrix | Ubuntu/Windows × Node.js 22/24 (4개) | macOS 추가, 3개 OS × 2개 버전 (6개) |
| 공통 검증 | build/test에 환경 준비가 반복됨 | 일반 CI와 벤치마크가 하나의 reusable-ci.yml 호출 |
| 환경 준비 | Node 설치·캐시·npm ci 반복 작성 | Composite Action이 설정·정확한 캐시 복원·미적중 설치 담당 |
| 캐시 | npm 다운로드 캐시, 매번 npm ci | 플랫폼·아키텍처·실제 Node 버전·lockfile 해시가 같은 node_modules 복원 |
| 캐시 키 | 기본 npm 키 | 별도 버전 namespace, 정확한 키만 사용, fallback 없음 |
| 배포 조건 | main이며 PR이 아니면 배포 | main push + 배포 대상 파일 변경 + 6개 검증 성공 |
| 문서 변경 | build/test/deploy 실행 | 변경 감지와 요약만 실행, 검사·배포 생략 |
| 측정 | 비교 자료 없음 | 미사용 3회, 최초 저장 1회, 적중 3회 + 원시 JSON·로그·평균·개선률 |

Matrix 확장은 호환성 검증 범위를 늘리는 변경이다. 전체 Matrix 실행이 이전보다 빨라졌다고 주장하지 않는다. 캐시 효과는 동일한 검증 워크플로우의 동일 코드와 동일 러너에서 따로 비교한다.

## 재사용 구조

```text
ci-cd.yml
  changes → verify (6개 Matrix 조합) → deploy (조건 충족 시)
               └ reusable-ci.yml
                   └ .github/actions/setup-node/action.yml
cache-benchmark.yml
  uncached (3개) ───────────────────────→ report
  seed (1개) → cached (3개) ────────────→ report
  각 표본도 동일한 reusable-ci.yml과 Composite Action을 호출
```

각 Matrix 작업은 해당 OS/Node 환경에서 lint·build·test를 모두 실행한다. 이 데모는 JS 정적 파일 빌드이므로 Ubuntu/Node.js 24의 테스트를 통과한 dist/만 배포 아티팩트로 올린다. 다른 조합도 성공해야 Deploy가 진행된다.

## 캐시의 정확성과 무효화

node_modules 캐시는 npm ci를 실행하면 삭제되므로 정확히 적중했을 때만 설치를 생략한다. 플랫폼·아키텍처·실제 Node.js 버전·package-lock.json SHA-256을 모두 키에 넣어 호환되지 않는 의존성을 재사용하지 않는다. prefix restore-keys와 OS 간 아카이브 공유는 사용하지 않는다. lockfile이나 Node 버전이 바뀌면 자동 미적중이 된다. 캐시 방식 변경 시 stressfit-deps-v1 namespace를 올린다.

캐시는 신뢰 경계나 배포 산출물이 아니다. PR에 배포 권한을 주지 않고, 매 실행 lint·build·test를 수행한다. 기본 contents: read, 배포 job에만 pages: write와 id-token: write를 부여한다. 워크플로우는 pull_request_target을 사용하지 않는다.

## 변경 파일과 배포 결정

| 변경/이벤트 | 검사 | 배포 |
|---|---|---|
| PR에서 앱 파일 수정 | 6개 Matrix | 생략 |
| feature/** push에서 앱 파일 수정 | 6개 Matrix | 생략 |
| main push에서 앱 파일 수정 | 6개 Matrix | 모두 성공하면 실행 |
| main 또는 PR에서 README/docs만 수정 | 생략 | 생략 |
| 테스트·검사 스크립트·워크플로우만 수정 | 6개 Matrix | 생략 |
| 수동 CI 실행 | 직전 커밋 비교 결과에 따라 검사 | 생략 |

배포 대상은 src/, public/, package.json, package-lock.json, scripts/build.js다. 검사 대상에는 tests/, scripts/, 공통 액션과 CI 워크플로우, eslint.config.js도 포함한다.

PR은 base/head SHA, push는 before/after SHA를 비교한다. 새 브랜치는 전체 파일을 검사한다. git diff의 --no-renames와 NUL 구분을 사용하여 삭제·이동과 공백이 든 파일명도 처리한다. 비교가 실패하면 전체 파이프라인이 실패하여 배포하지 않는다. 요약 job은 생략·실패 결과도 표시한다.

## 재현

```sh
npm ci
npm run verify
```

Node.js 24 권장. Windows PowerShell 실행 정책 오류 시 npm 대신 npm.cmd를 사용한다.

GitHub Actions에서 Cache benchmark → Run workflow를 실행하면 새로운 run/attempt별 캐시를 사용한다. 같은 커밋에서 7개 표본을 측정하고 Summary 및 cache-benchmark-evidence 아티팩트에 보고서와 JSON을 생성한다. 3개 적중 표본에서 cache-hit=true를 검증하므로 최초 저장을 적중으로 혼동하지 않는다.

GitHub Pages 최초 게시에는 저장소 Settings → Pages → Source: GitHub Actions 설정이 필요하다. 이후 앱 파일 변경을 main에 반영하면 자동 배포된다. 문서만 수정하면 재배포하지 않는다.

## 공식 참고 자료

- [재사용 워크플로우와 Composite Action의 차이](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations)
- [Reusable Workflow](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [actions/cache](https://github.com/actions/cache)
- [setup-node 캐시는 node_modules를 저장하지 않음](https://github.com/actions/setup-node#caching-global-packages-data)
- [Pages 배포](https://github.com/actions/deploy-pages)
