# GitHub Actions 기반 기본 CI/CD 구축

## 1. 프로젝트 선택 이유와 구현 범위

StressFit은 스트레스 수준과 운동 여건에 맞는 루틴을 추천하는 학기 프로젝트다.
기존 기획에 CI/CD 실습을 연결하면 프로젝트 진행 과정과 자동 검증의 필요성을 함께 설명할 수 있다.
아직 서비스 코드가 없는 단계여서, 상태·시간·장소를 입력받는 작은 추천 데모를 만들었다.
HTML/CSS/JavaScript, Node.js, ESLint, Node 내장 테스트 도구만 사용해 흐름을 이해하기 쉽게 구성했다.
이 데모는 전체 React/FastAPI MVP 구현이나 의료·운동 처방 모델을 의미하지 않는다.

## 2. 제출 링크

- 저장소: https://github.com/e-chang0/StressFit
- Workflow YAML: https://github.com/e-chang0/StressFit/blob/main/.github/workflows/ci-cd.yml
- Actions 실행 목록: https://github.com/e-chang0/StressFit/actions/workflows/ci-cd.yml

배포에는 Pages 설정과 main 반영이 필요하다. 실행 건별 성공 여부는 Actions에서 확인한다.
최종 제출 시 성공한 main 실행의 주소(`/actions/runs/숫자`)도 함께 첨부한다.

## 3. 요구사항 대응

| 과제 요구사항 | 구현 |
|---|---|
| Node.js 또는 Python | Node.js 기반 JavaScript 프로젝트 |
| Lint 자동 실행 | `npm run lint`로 ESLint 검사 |
| Test 자동 실행 | `npm test`로 추천 규칙과 배포 파일을 검사 |
| Matrix 전략 | Ubuntu/Windows × Node.js 22/24, 총 4개 조합 |
| Secrets 주입 | Deploy의 `token: ${{ secrets.GITHUB_TOKEN }}` |
| 작업 의존성 | Test의 `needs: build`, Deploy의 `needs: [build, test]` |
| 아티팩트 업로드 | Build의 `stressfit-build` 업로드 |
| 아티팩트 다운로드 | Test와 Deploy에서 같은 `stressfit-build` 다운로드 |
| 실제 배포 | main의 모든 검사가 성공하면 GitHub Pages 게시 |

## 4. 실행 흐름

```text
push / pull_request / 수동 실행
               │
               ▼
Build and Lint (Ubuntu, Node.js 22)
  npm ci → ESLint → dist/ 생성 → stressfit-build 업로드
               │ needs: build
               ▼
Test (4개 조합 병렬 실행)
  Ubuntu + Node.js 22    Ubuntu + Node.js 24
  Windows + Node.js 22   Windows + Node.js 24
  각 작업: 빌드 파일 다운로드 → npm test
               │ needs: [build, test]
               ▼
Deploy (main에서만)
  같은 빌드 파일 다운로드 → Pages 아티팩트 → GitHub Pages
```

Lint나 Build가 실패하면 Test를 실행하지 않는다.
4개 Test 중 하나라도 실패하면 Deploy를 실행하지 않는다.
`fail-fast: false`로 한 조합이 실패해도 나머지 조합의 결과를 확인한다.
feature 브랜치와 PR에서는 Build/Test만 실행하고 Deploy는 건너뛴다.

## 5. 빌드와 테스트

빌드는 `public/`의 HTML/CSS와 `src/`의 JavaScript를 `dist/`로 복사하는 간단한 방식이다.
번들러와 프레임워크를 추가하지 않아 CI/CD 자체에 집중할 수 있다.
테스트는 소스가 아닌 `dist/recommendation.js`를 불러오며, Matrix 작업 안에서 다시 빌드하지 않는다.
따라서 Build에서 만든 실제 배포 파일이 OS/버전 조합에서 동작하는지 검증한다.

테스트 항목은 9개다.

1. 배포 파일 4개 존재 및 빈 파일 여부
2. Pages 하위 경로를 위한 상대 경로
3. 높은 스트레스와 실내 조건의 추천
4. 높은 스트레스와 야외 조건의 추천
5. 일반 상태에서 장소별 추천
6. 가용 시간 및 20분 상한
7. 통증 입력 시 휴식 안내
8. 스트레스 범위·정수 조건과 경계값
9. 잘못된 시간·장소·통증 타입 거부

`stressfit-build`는 실행별로 분리되며 7일 보관한다. 제출 시 코드와 실행 로그 링크는 남지만,
아티팩트 자체는 보관 기간 후 삭제될 수 있으므로 필요하면 기간 내 다운로드한다.
Pages용 아티팩트는 `github-pages-${{ github.run_attempt }}`로 이름을 지정한다.
실패 작업을 재실행해도 이전 차수의 아티팩트와 충돌하지 않도록 하기 위해서다.

## 6. Secrets와 권한

`GITHUB_TOKEN`은 GitHub Actions가 실행 시 자동으로 제공하는 인증 토큰이다.
별도 PAT를 생성하거나 저장소에 토큰 문자열을 커밋할 필요가 없다.
배포 액션에 `${{ secrets.GITHUB_TOKEN }}`으로 주입하고 토큰 값은 출력하지 않는다.
사용자가 직접 등록하는 Repository Secret과 구분되는 GitHub 기본 제공 Secret이다.

기본 권한은 `contents: read`이며 Deploy에만 `pages: write`, `id-token: write`를 부여한다.
`id-token`은 Pages가 배포 출처를 검증할 때 사용한다.
`.env`는 Git에서 제외하고, 빌드에는 정적 화면 파일과 실행 코드만 넣는다.
브라우저에서 실행하는 JavaScript에는 비밀값을 넣으면 안 된다.

이번 구현은 기본 제공 Secret을 실제 배포 인증에 사용하는 방식이다.
교수자가 **직접 등록한 사용자 정의 Secret**을 별도로 요구하면 그 조건은 추가로 확인해야 한다.

## 7. 최초 배포 설정

1. https://github.com/e-chang0/StressFit/settings/pages 를 연다.
2. Build and deployment의 Source를 **GitHub Actions**로 선택한다.
3. CI/CD 브랜치를 main에 반영한다.
4. Actions → StressFit CI/CD에서 main 실행 결과를 확인한다.
5. 설정 후 기존 배포가 실패했다면 해당 main 실행의 실패 작업을 다시 실행한다.

배포가 성공하면 실행 화면의 `github-pages` 환경 링크로 접속한다.
예상 주소는 `https://e-chang0.github.io/StressFit/`이며, 성공 전에는 게시 완료로 간주하지 않는다.

## 8. 발표용 설명

> StressFit 추천 기능의 변경 사항을 자동으로 검사하도록 GitHub Actions를 구성했습니다.
> 먼저 ESLint 검사와 빌드를 수행하고, 빌드 파일을 아티팩트로 저장합니다.
> 다음으로 Ubuntu와 Windows, Node.js 22와 24를 조합한 네 환경에서 같은 빌드 파일을 테스트합니다.
> 모든 테스트가 성공한 main 브랜치만 GitHub Pages에 배포합니다.
> 배포 토큰은 Secrets를 통해 전달하고 배포 작업에 필요한 권한만 부여했습니다.

## 9. 참고한 공식 문서

- Matrix: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations
- 아티팩트 전달: https://docs.github.com/en/actions/tutorials/store-and-share-data
- GITHUB_TOKEN: https://docs.github.com/en/actions/tutorials/authenticate-with-github_token
- Pages 배포: https://github.com/actions/deploy-pages
