# Getting Started

StressFit에 처음 참여할 때 확인할 내용을 정리했다.

## 어떤 프로젝트인가?

운동을 하고 싶어도 피곤하거나 시간이 부족하면 무엇부터 해야 할지 정하기 어렵다. StressFit은 오늘의 스트레스 정도, 운동 경험, 시간과 장소를 바탕으로 짧은 운동 루틴을 추천하려는 서비스다.

첫 버전에서는 다음 흐름을 만드는 것이 목표다.

1. 오늘 상태와 운동할 수 있는 조건을 입력한다.
2. 조건에 맞는 운동 루틴과 추천 이유를 확인한다.
3. 운동을 마친 뒤 운동 전후 스트레스 점수와 만족도를 기록한다.

현재는 스트레스 수준, 시간, 실내·야외 여부와 통증 여부를 입력하는 추천 데모를 실행할 수 있다. 회원가입, 기록 저장, 주간 리포트는 아직 구현되지 않았다. README의 React·FastAPI·데이터베이스와 전체 서비스 구조는 구현 계획이다.

## 저장소 내려받기

Git을 설치한 뒤 터미널에서 아래 명령을 실행한다.

```bash
git --version
git clone https://github.com/e-chang0/StressFit.git
cd StressFit
git status
```

이미 내려받았다면 새로 clone하지 말고 기존 폴더로 이동한다. 수정 중인 파일이 없는지 `git status`로 확인한 뒤 `git pull --ff-only origin main`으로 갱신한다.

## 먼저 볼 곳

| 위치 | 확인할 내용 |
| --- | --- |
| [README](https://github.com/e-chang0/StressFit/blob/main/README.md) | 주요 기능, 기술 스택 계획, 개발 일정 |
| [프로젝트 보드](https://github.com/users/e-chang0/projects/4) | 할 일과 진행 상태 |
| [Issues](https://github.com/e-chang0/StressFit/issues) | 작업별 요구사항과 완료 조건 |
| [ADR](https://github.com/e-chang0/StressFit/tree/main/docs/adr) | 기술 선택과 그 이유 |

## 데모 실행하기

Git과 Node.js가 필요하다. 데모는 Node.js 22.13 이상에서 실행할 수 있고, 이 문서에서는 Node.js 24를 기준으로 한다. 저장소 루트에서 다음 순서로 실행한다.

```bash
node --version
npm ci
npm run lint
npm run build
npm test
npm run preview
```

브라우저에서 `http://127.0.0.1:4173`을 연다. 실행을 마치면 터미널에서 Ctrl+C로 종료한다. 테스트와 미리보기는 빌드한 `dist/`를 사용하므로 먼저 `npm run build`를 실행해야 한다.

확인 예시로 스트레스 5, 시간 10분, 장소 실내를 선택하고 루틴 확인 버튼을 누른다. 추천 제목, 시간과 이유가 표시되는지 확인한다. 현재 데모는 입력값을 서버에 저장하지 않는다.

## 처음 할 만한 작업

프로젝트 보드에서 작은 문서 작업 하나를 고르고, 이슈에 무엇을 바꿀지 적은 뒤 브랜치를 만든다. 예를 들어 설문 입력 항목 설명을 보완하거나 오류 제보 양식을 읽어보는 것부터 시작하면 된다.

작업 방법은 [Development Guide](https://github.com/e-chang0/StressFit/wiki/Development-Guide), clone이나 링크에서 문제가 생기면 [Troubleshooting](https://github.com/e-chang0/StressFit/wiki/Troubleshooting)을 참고한다.

[Wiki 홈으로](https://github.com/e-chang0/StressFit/wiki)
