# Git/GitHub 개발 환경 체크리스트

## 완료 항목

- [x] 독립 프로젝트 폴더 생성
- [x] Git 저장소 초기화
- [x] 기본 브랜치를 `main`으로 설정
- [x] `.gitignore` 작성
- [x] 프로젝트 제안서 작성
- [x] 로컬 첫 커밋 생성
- [x] GitHub 공개 저장소 생성: `e-chang0/StressFit`
- [x] 원격 저장소 연결

## GitHub에서 진행할 항목

- [x] SSH 키 등록 및 연결 확인
- [x] `main` 브랜치 첫 푸시

```bash
ssh -T git@github.com
git remote set-url origin git@github.com:e-chang0/StressFit.git
git push -u origin main
```

현재 원격 저장소는 SSH 주소로 연결되어 있다.

## 확인 명령어

```bash
git status
git log --oneline
git remote -v
```
