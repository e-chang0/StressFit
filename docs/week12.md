# 12주차 · Shift-Left 테스트 자동화

원하는 결과를 먼저 테스트로 적었습니다. 새 테스트가 실패하는 것을 확인한 뒤 기능을 구현했고, 테스트가 통과하면 코드를 정리한 후 기존 테스트와 새 테스트를 다시 실행했습니다.

| 추가한 기능 | 테스트로 확인한 결과 | Red | Green | Refactor |
| --- | --- | --- | --- | --- |
| 비 오는 날 실내 추천 | 비가 오는 날 야외 운동을 골랐으면 실내 루틴을 보여준다. | [817775d](https://github.com/e-chang0/StressFit/commit/817775d) | [671d992](https://github.com/e-chang0/StressFit/commit/671d992) | [d78efb8](https://github.com/e-chang0/StressFit/commit/d78efb8) |
| 가벼운 강도 선택 | 스트레스가 낮아도 사용자가 원하면 낮은 강도로 추천한다. | [d32677a](https://github.com/e-chang0/StressFit/commit/d32677a) | [11e2bec](https://github.com/e-chang0/StressFit/commit/11e2bec) | [d38f95c](https://github.com/e-chang0/StressFit/commit/d38f95c) |
| 운동 밴드 추천 | 일반 강도의 실내 루틴에서 운동 밴드를 사용할 수 있다. | [44247f7](https://github.com/e-chang0/StressFit/commit/44247f7) | [fd144a6](https://github.com/e-chang0/StressFit/commit/fd144a6) | [dbc2896](https://github.com/e-chang0/StressFit/commit/dbc2896) |
| 스트레칭 목표 추천 | 스트레칭이 목표라면 전신 스트레칭을 추천한다. | [e9e9023](https://github.com/e-chang0/StressFit/commit/e9e9023) | [53bc97c](https://github.com/e-chang0/StressFit/commit/53bc97c) | [6ee5239](https://github.com/e-chang0/StressFit/commit/6ee5239) |
| 운동 시간 나누기 | 준비, 본운동, 마무리의 합은 추천 시간과 같고 휴식에는 단계가 없다. | [85ebb75](https://github.com/e-chang0/StressFit/commit/85ebb75) | [9b5cfa0](https://github.com/e-chang0/StressFit/commit/9b5cfa0) | [25a4b93](https://github.com/e-chang0/StressFit/commit/25a4b93) |

## 단위 테스트와 CI

```sh
npm ci
npm run verify
```

기존 테스트와 새 테스트를 함께 실행합니다. 커버리지는 `src/`의 추천 로직, 기능 플래그, 이벤트 기록, 저장소 처리, 롤아웃 판단을 대상으로 합니다. 브라우저 화면에 연결하는 진입 파일(`main.js`, `lab.js`)은 단위 테스트 커버리지에서 제외합니다. 메인 화면의 추천 흐름은 Playwright로 따로 확인합니다.

GitHub Actions는 코드와 테스트가 바뀐 push와 PR에서 줄, 분기, 함수 커버리지를 각각 확인합니다. 항목 하나라도 80% 미만이면 검사가 실패합니다. [GitHub Actions 실행 목록](https://github.com/e-chang0/StressFit/actions/workflows/ci-cd.yml)

## 선택과제

- **기존 코드 리팩토링**. 스트레스 6과 7의 경계, 20분 제한, 통증이 있을 때의 휴식 결과를 확인하는 테스트를 추가했습니다. 이후 실내 여부와 추천 조건이 중복되던 코드를 정리했고, 같은 테스트가 계속 통과하는 것을 확인했습니다. [회귀 테스트 커밋](https://github.com/e-chang0/StressFit/commit/18a5f50) · [기존 추천 테스트](../tests/recommendation.test.js)
- **Playwright**. 비가 오는 날 야외 운동과 밴드를 선택하면 실내 밴드 운동과 시간표가 표시되는지 확인합니다. 같은 화면에서 통증을 표시하고 다시 추천을 받으면 휴식 안내가 나오고 시간표와 완료 버튼이 숨겨지는지도 확인합니다. CI에서 실패하면 해당 실행의 Artifacts에서 `stressfit-e2e-screenshots`를 받을 수 있습니다. [브라우저 테스트 코드](../e2e/recommendation.spec.js)

```sh
npm run build
npx playwright install chromium
npm run test:e2e
```

로컬에서 실패하면 스크린샷이 `test-results/`에 저장됩니다. GitHub Actions의 스크린샷은 30일 동안 보관합니다.
