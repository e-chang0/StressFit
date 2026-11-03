# Discussions 운영 방법

질문이 코드 수정 이슈와 섞이면 필요한 내용을 다시 찾기 어렵다. 사용 방법과 설계 이야기는 Discussions에 두고, 실제로 할 일이 정해지면 이슈로 연결한다.

## 카테고리

| 이름 | 형식 | 올릴 내용 |
| --- | --- | --- |
| [Announcements](https://github.com/e-chang0/StressFit/discussions/categories/announcements) | Announcement | 일정 변경, 새 문서와 주요 변경 안내 |
| [Q&A](https://github.com/e-chang0/StressFit/discussions/categories/q-a) | Question / Answer | 설치 방법, 코드와 문서에 대한 질문 |
| [Ideas](https://github.com/e-chang0/StressFit/discussions/categories/ideas) | Open-ended discussion | 아직 구체화하지 않은 기능 아이디어 |
| [General](https://github.com/e-chang0/StressFit/discussions/categories/general) | Open-ended discussion | `[RFC]` 제목으로 선택지를 비교하고 결정할 필요가 있는 제안 |

GitHub 기본 카테고리 중 위 네 가지를 중심으로 운영한다. RFC는 General에 `[RFC]` 제목으로 모은다. 아직 글이 많지 않아 별도 카테고리를 늘리지 않았고, 토론이 많아지면 분리할 수 있다. Polls와 Show and tell은 당장 사용하지 않는다. 앱 사용 중 재현되는 오류는 Bug report 이슈 양식을 사용한다.

## RFC는 이렇게 진행한다

1. [RFC 양식](rfc-template.md)에 따라 배경, 제안, 대안, 단점, 질문을 적는다.
2. General 카테고리에 `[RFC]` 제목으로 올리고 의견을 받을 기간을 적는다. 기본은 7일이다.
3. 댓글로 나온 의견과 수정한 내용을 본문 또는 후속 댓글에 남긴다.
4. 기간이 끝나면 채택·수정 후 채택·보류 중 하나와 이유를 적는다.
5. 채택한 내용은 이슈로 나누고 기술 결정은 ADR에 남긴다.

참여자가 없으면 혼자 검토했다는 사실과 남은 질문을 적는다. 여러 사람이 합의한 것으로 표시하지 않는다. 기한이 지났다고 자동으로 채택하지 않는다.

## 첫 RFC

[RFC-0001: 추천 이유를 어떤 항목으로 보여줄까?](https://github.com/e-chang0/StressFit/discussions/14) · [본문 원본](rfc-0001-recommendation-reason.md)

의견 수렴 기간은 2026-11-03~2026-11-10(한국 시간)이다. 현재 데모의 이유 문자열을 전체 서비스로 확장할 때 화면과 API에서 함께 사용할 설명 범위를 정하려는 토론이다.

## 답변 목표

`support` 라벨이 있는 이슈는 등록 후 48시간 안에 담당자가 첫 답변을 남기는 것을 목표로 한다. 봇 댓글은 답변으로 세지 않는다. 해결 완료 기한과는 다르며, 주말을 포함한 경과 시간으로 계산한다. 자동화 초안의 범위는 Issues이고, Discussions 답변 시간은 이번 초안에서 자동 추적하지 않는다.

자세한 기준은 [자동 응답·SLA·주간 요약](automation.md)을 참고한다.
