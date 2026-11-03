# Wiki·커뮤니티 과제 확인 기록

작업일: 2026-11-03(한국 시간)

## 과제 결과

| 과제 | 준비한 내용 | 확인 결과 |
| --- | --- | --- |
| 필수 | Getting Started, Development Guide, Troubleshooting | GitHub Wiki에 게시 완료. 세 페이지 모두 HTTP 200 응답과 다른 두 문서로 연결되는 링크 확인 |
| 선택 1 | `docs/adr/` 구조·템플릿·첫 ADR | main 반영 완료 |
| 선택 1 | 자동 응답·SLA 추적·주간 요약 초안 | main 반영 후 Actions 수동 미리보기 세 건 모두 성공 |
| 선택 2 | Discussions와 카테고리 용도 | 활성화 완료. Announcements·Q&A·Ideas·General로 용도 정리 및 안내 게시 |
| 선택 2 | RFC-0001 추천 이유 표시 방식 | 실제 토론과 작성자 검토 댓글 게시. 의견 수렴 중 |

## Wiki 문서

- [Getting Started](https://github.com/e-chang0/StressFit/wiki/Getting-Started)
- [Development Guide](https://github.com/e-chang0/StressFit/wiki/Development-Guide)
- [Troubleshooting](https://github.com/e-chang0/StressFit/wiki/Troubleshooting)
- [Wiki 홈](https://github.com/e-chang0/StressFit/wiki)

사용자가 첫 Home 페이지를 만든 뒤 문서와 사이드바를 게시했다. Wiki 게시 커밋은 `03fbe6d`이며 원본은 `docs/wiki/`에 보관한다. 앱 실행 안내는 현재 HTML/CSS/JavaScript 데모를 기준으로 작성하고, React·FastAPI·DB는 개발 계획으로 구분했다.

## ADR과 토론

- [ADR 안내와 목록](../adr/README.md)
- [ADR 템플릿](../adr/0000-template.md)
- [ADR-0001: 규칙 기반 추천](../adr/0001-rule-based-recommendation.md)
- [카테고리 이용 안내](https://github.com/e-chang0/StressFit/discussions/17)
- [RFC-0001 실제 토론](https://github.com/e-chang0/StressFit/discussions/14)
- [작성자 검토 댓글](https://github.com/e-chang0/StressFit/discussions/14#discussioncomment-19365821)

RFC는 2026-11-10까지 의견을 받는 중이다. 현재 다른 참여자의 의견은 없으며, 작성자 검토를 여러 사람의 합의로 표시하지 않았다. 기한 후 실제 의견과 남은 질문을 정리하는 방식으로 운영한다.

## 검증 결과

- `npm run lint`, `npm run build` 성공
- `npm test`: 데모 9개와 커뮤니티 자동화 12개, 합계 21개 통과
- YAML 9개 파일 문법, 문서 상대 링크 14개 확인
- `git diff --check` 통과
- [PR 최종 Community Checks](https://github.com/e-chang0/StressFit/actions/runs/41575461689): 성공
- [PR 최종 기존 CI](https://github.com/e-chang0/StressFit/actions/runs/41575461619): Build·Lint와 Ubuntu/Windows의 Node 22/24 테스트 성공

[PR #16](https://github.com/e-chang0/StressFit/pull/16)은 사용자 승인 후 main에 병합했다. 병합 커밋은 `2931e4770e61afe3bb4b97ead437d77f6b9165e1`이다.

## 자동화 초안의 실제 실행

| 워크플로우 | 확인한 내용 | 실행 결과 |
| --- | --- | --- |
| 자동 응답 | 실제 문서 작업 이슈 #15를 대상으로 dry_run=true 실행 | [성공](https://github.com/e-chang0/StressFit/actions/runs/41576812094) |
| SLA 추적 | support 이슈의 답변 대기 상태를 dry_run=true로 점검 | [성공](https://github.com/e-chang0/StressFit/actions/runs/41576815723) |
| 주간 요약 | 최근 7일 이슈·새 PR·첫 답변 대기 목록을 Summary와 artifact로 생성 | [성공](https://github.com/e-chang0/StressFit/actions/runs/41576819536) |

주간 artifact 이름은 `community-weekly-summary-41576819536`이고 30일 보관한다. 자동 응답 미리보기 후 이슈 #15의 댓글이 추가되지 않았고, SLA 지연 라벨도 변경되지 않은 것을 확인했다.

자동 응답과 SLA 쓰기는 기본적으로 꺼진 초안 상태를 유지한다. 예약 점검은 미리보기로 동작하고 주간 요약은 읽기 전용으로 생성한다. 실제 운영으로 바꾸는 방법과 48시간 첫 답변 기준은 [자동화 안내](automation.md)에 정리했다.
