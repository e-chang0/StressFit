# Development Guide

큰 기능을 한 번에 올리기보다 이슈 하나에 맞춰 작게 작업하는 것을 기본으로 한다. 현재 저장소에는 추천 데모와 CI가 있고, 전체 서비스는 앞으로 확장할 예정이다.

## 작업 순서

1. 이슈와 프로젝트 보드를 보고 작업 목적과 완료 조건을 확인한다.
2. 최신 `main`에서 작업 브랜치를 만든다.
3. 파일을 수정하고 변경 내용에 맞는 검증을 한다.
4. 커밋하고 Pull Request(PR)를 만든다.
5. 피드백을 반영한 뒤 병합하고 프로젝트 보드 상태를 바꾼다.

```bash
git switch main
git pull --ff-only origin main
git switch -c docs/update-survey-guide
# 파일 수정 후
git diff --check
git add docs/
git commit -m "docs: 설문 입력 항목 설명 보완"
git push -u origin docs/update-survey-guide
```

위 명령은 예시다. 실제 수정한 파일만 `git add`하고, 기능 구현은 `feature/`, 오류 수정은 `fix/`, 문서 작업은 `docs/`로 브랜치 이름을 붙이면 알아보기 쉽다.

## PR에 적을 내용

- 왜 바꿨는지와 주요 변경 내용
- 관련 이슈 번호
- 직접 확인한 방법과 결과
- 아직 해결하지 못한 부분

혼자 작업할 때도 diff를 다시 읽고 확인한 점을 남긴다. 작성자가 직접 확인한 내용은 자기 검토라고 적고, 다른 사람이 리뷰한 것처럼 쓰지 않는다.

## 문서와 기술 결정

Wiki 원본은 `docs/wiki/`에도 보관한다. 원본을 수정했다면 GitHub Wiki에도 같은 내용을 반영한다. 문서 제목이나 파일명을 바꿀 때는 다른 두 문서에서 연결되는 링크도 확인한다.

추천 방식이나 데이터 저장 방법처럼 나중에 이유가 궁금해질 결정은 `docs/adr/0000-template.md`를 복사해서 기록한다. 여러 선택지를 비교할 필요가 있으면 먼저 Discussions의 General에 RFC를 올려 의견을 받고, 결정된 내용을 ADR에 옮긴다. [ADR 작성 안내](https://github.com/e-chang0/StressFit/tree/main/docs/adr)와 [토론 운영 방법](https://github.com/e-chang0/StressFit/blob/main/docs/community/discussions-guide.md)을 참고한다.

## 현재 코드 위치

| 경로 | 역할 |
| --- | --- |
| `public/` | 데모 HTML과 CSS |
| `src/recommendation.js` | 입력 검증과 추천 규칙 |
| `src/main.js` | 입력 화면과 추천 결과 연결 |
| `scripts/build.js`, `scripts/preview.js` | 빌드와 로컬 미리보기 |
| `scripts/community.cjs` | 이슈 안내·SLA·주간 요약 |
| `tests/` | 데모와 커뮤니티 자동화 테스트 |

## 확인 방법

문서는 링크, 파일 경로, 예시 명령이 현재 저장소와 맞는지 확인한다. 코드 변경 후에는 저장소 루트에서 다음 순서로 검증한다.

```bash
npm run lint
npm run build
npm test
git diff --check
```

`npm test`는 데모와 커뮤니티 자동화 테스트를 실행한다. 자동화만 확인할 때는 `node --test tests/community.test.cjs`로 실행할 수 있다. 워크플로우의 실행과 미리보기는 [자동화 초안](https://github.com/e-chang0/StressFit/blob/main/docs/community/automation.md)에 설명했다.

## 앱 구현 시 지킬 점

실제 건강정보나 계정 비밀번호를 예시 데이터와 로그에 넣지 않는다. 추천 기능은 입력값 검증과 운동 제외 조건부터 확인하고, 추천 결과를 치료 효과처럼 단정하지 않는다. 어떤 운동을 제외할지에 대한 세부 기준은 구현 전에 따로 검토한다.

저장소를 처음 받는 방법은 [Getting Started](https://github.com/e-chang0/StressFit/wiki/Getting-Started), 작업 중 오류는 [Troubleshooting](https://github.com/e-chang0/StressFit/wiki/Troubleshooting)에서 확인한다.

[Wiki 홈으로](https://github.com/e-chang0/StressFit/wiki)
