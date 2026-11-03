# Wiki 원본과 게시 방법

`docs/wiki/`는 Wiki에 올릴 Markdown 원본을 보관하는 곳이다. 일반 저장소와 GitHub Wiki는 별도 Git 저장소이므로 양쪽을 함께 갱신해야 한다.

## 처음 게시할 때

1. 저장소 Settings → General → Features에서 Wikis가 켜져 있는지 확인한다.
2. Wiki 탭에서 첫 Home 페이지를 만든다. 첫 페이지 생성 전에는 Wiki Git 저장소가 없을 수 있다.
3. 다른 폴더에 Wiki 저장소를 내려받는다.

```bash
git clone https://github.com/e-chang0/StressFit.wiki.git
```

4. `docs/wiki/`의 `Home.md`, `Getting-Started.md`, `Development-Guide.md`, `Troubleshooting.md`, `_Sidebar.md`를 Wiki 저장소 루트로 복사한다.
5. Wiki 저장소에서 변경 내용을 확인하고 커밋·push한다.
6. Wiki에서 세 문서를 열어 다른 두 문서로 이동되는지 확인한다.

```bash
cd StressFit.wiki
git diff --check
git add Home.md Getting-Started.md Development-Guide.md Troubleshooting.md _Sidebar.md
git commit -m "docs: add StressFit wiki guides"
git push origin HEAD
```

기존 Wiki가 있다면 새로 덮어쓰지 말고 먼저 pull하고 변경 내용을 비교한다. 사이드바 파일명은 `_Sidebar.md` 그대로 사용한다. 문서를 수정할 때도 원본 PR과 Wiki 수정 기록을 함께 남긴다.

[Wiki 열기](https://github.com/e-chang0/StressFit/wiki)
