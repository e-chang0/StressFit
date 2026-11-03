# Wiki·커뮤니티 과제 확인 기록

작업일: 2026-11-03(한국 시간)

## 확인할 항목

| 과제 | 준비한 내용 | 게시·검증 상태 |
| --- | --- | --- |
| 필수 | Getting Started, Development Guide, Troubleshooting과 상호 링크 | 원본·로컬 Wiki 커밋 준비 완료. GitHub 첫 Wiki 페이지 생성이 필요해 게시 대기 |
| 선택 1 | `docs/adr/` 안내·템플릿·첫 ADR | PR #16에 작성 완료 |
| 선택 1 | 자동 응답·SLA 추적·주간 요약 워크플로우 초안 | PR #16에 작성 완료, 로컬/API 대체 테스트 통과. 실제 수동 Actions 미리보기는 기본 브랜치 반영 후 가능 |
| 선택 2 | Discussions와 카테고리 용도 | 활성화 확인. Announcements·Q&A·Ideas·General로 용도 정리 |
| 선택 2 | RFC-0001 추천 이유 표시 방식 | [실제 토론 #14](https://github.com/e-chang0/StressFit/discussions/14) 게시, 작성자 검토 댓글 1개 |

워크플로우는 초안이므로 자동 응답과 SLA 쓰기는 기본적으로 꺼져 있다. RFC는 11월 10일까지 의견을 받는 중이며 다른 참여자의 의견은 아직 없다. 여러 사람의 합의나 완료된 토론으로 기록하지 않는다.

## 검증 결과

- `npm run lint`, `npm run build` 성공
- `npm test`: 데모 9개와 커뮤니티 자동화 12개, 합계 21개 통과
- YAML 9개 파일 문법 및 문서 상대 링크 14개 확인
- `git diff --check` 통과
- [Community Checks](https://github.com/e-chang0/StressFit/actions/runs/41575143024): PR 초기 코드 커밋 검사 성공
- [기존 CI](https://github.com/e-chang0/StressFit/actions/runs/41575142917): Build·Lint와 Ubuntu/Windows의 Node 22/24 테스트 성공

## 남은 게시 단계

[PR #16](https://github.com/e-chang0/StressFit/pull/16)에 문서와 코드가 있으며, 기본 브랜치 병합은 사용자 승인 대기다. 병합 후 세 워크플로우를 수동 미리보기로 실행하고 결과 링크를 추가한다.

Wiki는 기능이 켜져 있지만 첫 페이지가 없어 Git 저장소 주소가 아직 만들어지지 않았다. Home 페이지를 한 번 저장한 뒤 준비한 Wiki 커밋을 게시하고 세 문서의 상호 링크를 실제 페이지에서 확인해야 한다. `docs/wiki/` 파일만 있는 상태를 Wiki 게시 완료로 세지 않는다.
