# 배포 자동화

## 구성

- GitHub Pages: 기존 CI에서 main의 앱 변경을 검사한 후 배포한다.
- Netlify: 저장소를 연결하면 main을 배포하고 PR마다 별도 미리보기 주소를 만든다. `netlify.toml`에 빌드 명령과 배포 폴더를 적었다.
- Render: `render.yaml`로 Docker 웹 서비스를 만든다. main의 CI 검사가 통과하면 Render가 이미지를 다시 빌드해 배포한다.
- 상태 확인: Render가 `/health`를 확인한다. GitHub Actions도 30분마다 같은 주소를 검사하도록 만들었다.

Netlify 프리뷰와 Render 배포는 각각 서비스 연결 및 실행 결과를 확인해야 한다.

## Netlify 연결

1. Netlify에 가입하고 GitHub 저장소 `e-chang0/StressFit`을 연결한다.
2. production 브랜치를 `main`으로 선택한다. 빌드 명령과 폴더는 `netlify.toml`을 사용한다.
3. PR을 열고 Netlify의 Deploy Preview 검사에서 주소를 확인한다.
4. PR이 Netlify 연결 전에 만들어졌다면 새 커밋을 올려 프리뷰 빌드를 확인한다.

## Render 연결

1. Render에 가입하고 GitHub를 연결한 다음 Blueprint로 이 저장소를 선택한다.
2. `render.yaml`의 Free 웹 서비스를 생성하고 첫 배포 결과를 확인한다.
3. 서비스 주소 뒤에 `/health`를 붙여 정상 응답을 확인한다.
4. GitHub 저장소의 Settings → Secrets and variables → Actions → Variables에 `RENDER_HEALTH_URL`을 만들고 위 주소를 입력한다.
5. Actions의 `Check deployed service`를 수동 실행하고 결과를 확인한다. 변수가 없으면 검사는 건너뛴다.

Render의 로그와 Metrics 화면에서 배포와 서비스 상태를 확인할 수 있다. Actions 검사가 실패하면 실행 기록에 실패로 표시된다. 알림을 받으려면 GitHub 알림 설정도 확인한다. 무료 인스턴스는 유휴 상태에서 종료될 수 있으며 정기 검사는 무료 사용량에 영향을 줄 수 있다.

## Docker 실행

```sh
docker build -t stressfit .
docker run --rm -p 10000:10000 stressfit
curl http://localhost:10000/health
```

빌드 단계에서 정적 파일을 만들고 실행 단계에는 결과물과 서버 코드만 복사한다. 컨테이너는 일반 사용자로 실행한다. PR에서는 이미지 빌드와 페이지·헬스 응답을 검사한다. 실제 배포는 Render의 Git 연동이 담당한다. 문제가 생기면 Render에서 이전 배포로 되돌리고 Actions와 Render 로그를 확인한다.
