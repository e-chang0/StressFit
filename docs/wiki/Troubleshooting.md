# Troubleshooting

진행하다 막힐 수 있는 부분을 모았다. 아래 내용은 확인 방법이며, 실제로 발생하지 않은 오류를 해결한 기록으로 적은 것은 아니다.

## clone이 안 되거나 저장소를 찾을 수 없을 때

주소가 `https://github.com/e-chang0/StressFit.git`인지 먼저 확인한다. 브라우저에서도 저장소가 열리는지 보고, 네트워크 연결과 Git 설치 상태를 확인한다.

```bash
git --version
git remote -v
```

`git remote -v`는 이미 받은 저장소 폴더 안에서 실행한다. 폴더가 이미 있다는 오류라면 기존 폴더로 이동해서 `git status`를 확인한다.

## npm ci나 미리보기가 안 될 때

`package.json`이 있는 StressFit 루트 폴더에서 실행하는지 확인한다. `node --version`으로 Node.js 22.13 이상인지 보고, 이 문서의 권장 버전인 24를 사용할 수 있다. `npm ci`가 실패하면 먼저 오류에 나온 네트워크 또는 버전 문제를 확인한다. 이유 없이 lock 파일을 지우지는 않는다.

미리보기에서 `Run npm run build first.`가 나오거나 테스트가 `dist/` 파일을 찾지 못하면 아래 순서로 다시 실행한다.

```bash
npm run build
npm test
npm run preview
```

`EADDRINUSE`는 4173 포트를 다른 프로그램이 쓰고 있다는 뜻이다. 이전 미리보기 터미널을 Ctrl+C로 종료한 뒤 다시 실행한다. 현재는 정적 데모이므로 FastAPI나 데이터베이스를 실행할 필요는 없다. 처음 설치하는 순서는 [Getting Started](https://github.com/e-chang0/StressFit/wiki/Getting-Started)에 있다.

## 추천 입력 오류가 나올 때

현재 데모에서 스트레스는 1~10 정수, 운동 시간은 5~60 정수, 장소는 실내 또는 야외만 받는다. 화면의 시간 선택지는 이 범위 안의 일부 값이다. 통증 항목을 선택했을 때 운동 대신 휴식 안내가 나오는 것은 정해 둔 데모 동작이다. 기록 저장과 실제 운동 처방 기능은 구현하지 않았다.

## pull할 때 수정 파일 때문에 중단될 때

`git status`와 `git diff`로 내가 바꾼 내용을 먼저 확인한다. 작업을 커밋하거나 따로 보관한 다음 다시 pull한다. 변경 내용을 모르고 `reset --hard`를 실행하면 작업을 잃을 수 있으니 사용하지 않는다.

충돌 표시가 보이면 두 변경 중 무엇을 남길지 확인해서 파일을 고치고, 저장 후 diff를 다시 확인한다. 작업 흐름은 [Development Guide](https://github.com/e-chang0/StressFit/wiki/Development-Guide)에 정리했다.

## Wiki 링크가 열리지 않을 때

Wiki 페이지 주소는 `.../wiki/Getting-Started`처럼 단어 사이에 하이픈을 사용한다. 일반 저장소의 `docs/wiki/Getting-Started.md`와 GitHub Wiki는 별도로 저장되므로 원본 파일만 올려서는 Wiki에 나타나지 않는다.

페이지가 실제로 게시되어 있는지, 이름의 대소문자와 하이픈이 같은지 확인한다. [Wiki 홈](https://github.com/e-chang0/StressFit/wiki)에서 세 문서를 차례로 열고 다른 두 문서로 이동해 본다.

## 자동 응답이나 SLA 표시가 안 생길 때

초안은 기본적으로 미리보기만 한다. 실제 쓰기 동작을 켜는 방법은 [자동화 안내](https://github.com/e-chang0/StressFit/blob/main/docs/community/automation.md)에 있다.

- 이슈에 `support` 라벨이 있는지 확인한다. 기존 개발 백로그 전체를 답변 지연으로 표시하지 않기 위한 구분이다.
- Actions 실행 기록에서 오류와 실행 요약을 확인한다.
- 예약 실행은 워크플로우가 기본 브랜치에 있어야 동작하며 실행이 지연될 수도 있다.
- 봇 안내와 이슈 작성자의 댓글은 담당자의 첫 답변으로 세지 않는다. 담당자의 실제 답변 뒤 다음 점검 때 지연 라벨이 사라진다.

## 질문이나 오류 제보를 남길 때

사용 방법과 설계 질문은 [Discussions](https://github.com/e-chang0/StressFit/discussions), 고칠 대상이 분명한 오류는 [Issues](https://github.com/e-chang0/StressFit/issues)에 작성한다. 실행한 명령, 기대한 결과, 실제 오류 메시지를 적으면 확인하기 쉽다. 비밀번호와 개인 건강정보는 지우고 올린다.

[Getting Started](https://github.com/e-chang0/StressFit/wiki/Getting-Started) · [Development Guide](https://github.com/e-chang0/StressFit/wiki/Development-Guide) · [Wiki 홈](https://github.com/e-chang0/StressFit/wiki)
