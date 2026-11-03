# 자동화 초안

이슈를 받았다는 안내를 남기고, 첫 답변을 오래 기다리는 이슈를 찾아보는 용도로 만든 초안이다. 자동 응답이 문제를 해결했다고 보지는 않는다.

## 워크플로우 세 가지

| 파일 | 언제 실행하나? | 하는 일 |
| --- | --- | --- |
| `support-auto-reply.yml` | 이슈 등록·재개·라벨 추가, 수동 실행 | 열린 `support` 이슈에 안내 댓글을 한 번 남김 |
| `support-sla.yml` | 매일 오전 9시 17분(한국 시간), 수동 실행 | 답변 대기 48시간 이상이면 `sla: overdue` 라벨 표시 |
| `community-weekly-summary.yml` | 월요일 오전 9시 23분(한국 시간), 수동 실행 | 최근 7일 이슈·새 PR과 답변 대기 목록을 요약 |

예약 실행은 기본 브랜치에 반영된 뒤 동작하며 GitHub 사정으로 지연될 수 있다. 주간 요약은 Actions 실행의 Summary와 30일 보관 artifact에 남긴다. 이슈나 Discussions에 주간 글을 자동 게시하지는 않는다.

## SLA 기준

여기서 SLA는 서비스 운영 계약이 아니라 과제에서 정한 **첫 답변 목표 시간**이다.

- 대상: `support` 라벨이 붙은 GitHub 이슈. PR과 일반 개발 백로그는 제외한다.
- 시작: 이슈 등록 시각. 나중에 `support`를 붙여도 등록 시각부터 계산한다.
- 목표: 주말을 포함해 48시간 안에 첫 담당자 답변을 남긴다. 해결 완료 시간과 다르다.
- 답변 인정: GitHub가 `OWNER`, `MEMBER`, `COLLABORATOR`로 표시한 사람의 댓글 중 가장 이른 것. 봇, 이슈 작성자 본인, 자동 안내 댓글은 제외한다.
- 지연 표시: 열린 이슈에 담당자 답변이 없고 48시간 이상 지났을 때 라벨을 붙인다.
- 해제: 담당자가 답변하거나 이슈를 닫거나 `support`를 제거하면 다음 점검 때 지연 라벨을 뗀다.

처음 등록한 시점의 응답만 추적하므로 이슈를 다시 열어도 시계가 초기화되지는 않는다. 답변 후 해결까지 걸리는 시간, 삭제된 댓글, Discussions 답변 시간은 이 초안의 범위에 넣지 않았다. 뒤늦게 답한 이슈는 지연 대기 목록에서는 빠지므로 과거 위반률을 보존하는 통계로 쓰면 안 된다.

## 초안의 실행 모드

기본은 **미리보기**다. 저장소 변수 `COMMUNITY_AUTOMATION_ENABLED`가 없으면 이슈 이벤트와 예약 SLA 점검은 댓글·라벨을 바꾸지 않고 예정 동작만 Summary에 보여준다. 주간 요약은 읽기 전용이라 그대로 생성한다.

수동으로 실행할 때는 Actions에서 워크플로우를 고르고 `Run workflow`를 누른다. 자동 응답은 대상 `support` 이슈 번호를 입력한다. `dry_run` 기본값이 true이므로 먼저 결과를 읽는다. 수동 실행에서 false를 선택하면 해당 실행만 실제로 댓글 또는 라벨을 변경한다.

계속 운영하려면 Settings → Secrets and variables → Actions → Variables에 `COMMUNITY_AUTOMATION_ENABLED=true`를 추가한다. 이후 새 이벤트와 예약 SLA 점검부터 실제 쓰기가 적용된다. 다시 미리보기로 돌리려면 값을 false로 바꾼다. 이미 작성한 댓글과 라벨을 이 설정으로 지우지는 않는다.

기존 백로그에는 일괄적으로 `support`를 붙이지 않는다. 새 Bug report와 Feature request에는 이 라벨이 포함되며, 문서·사용 질문을 이슈로 받는 경우 수동으로 붙일 수 있다. Discussions의 질문은 Q&A에서 별도로 답한다.

## 권한과 확인할 점

자동 응답과 SLA는 `contents: read`, `issues: write`만 사용한다. 주간 요약은 읽기 권한만 사용한다. 별도 개인 토큰은 필요 없다. 사용자 제목·본문을 셸 명령이나 실행 코드에 끼워 넣지 않는다.

```bash
node --test tests/community.test.cjs
git diff --check
```

로컬 테스트는 GitHub API 대신 가짜 응답으로 중복 댓글 방지, 48시간 경계, 작성자·봇 제외, 지연 라벨 해제와 요약 기간을 확인한다. 실제 Actions 미리보기 결과는 [제출 확인 기록](assignment-status.md)에 따로 적는다.

워크플로우 작성은 [GitHub Actions 문법](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [이벤트 설명](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [github-script](https://github.com/actions/github-script)를 참고했다.
