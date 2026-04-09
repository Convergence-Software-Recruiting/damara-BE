## About

This project was created with [express-generator-typescript](https://github.com/seanpmaxwell/express-generator-typescript).

## Service Architecture Overview

```mermaid
flowchart LR
  subgraph Client
    A[index.html<br/>대시보드 & 상품목록]
    B[users.html<br/>회원 관리]
    C[posts.html<br/>내 상품 관리]
  end

  subgraph Express
    R[BaseRouter (/api)]
    UC[User Controllers]
    PC[Post Controllers]
    UpC[Upload Controllers]
    App[app.ts<br/>middleware & error handler]
  end

  subgraph Services
    USvc[UserService]
    PSvc[PostService]
  end

  subgraph Data
    URepo[UserRepo]
    PRepo[PostRepo]
    Multer[multer disk storage]
  end

  DB[(MySQL<br/>Sequelize Models)]

  Client -->|fetch/forms| R
  R -->|/api/users| UC --> USvc --> URepo --> DB
  R -->|/api/posts| PC --> PSvc --> PRepo --> DB
  R -->|/api/upload| UpC --> Multer
  App --> DB
```

- **Views (`src/views` + `public/scripts`)**: Bootstrap + Handlebars UI로 회원/상품/이미지 시나리오를 구현했습니다.
- **Controllers (`src/controllers`)**: `parseReq`를 통해 Zod 검증을 수행하고, 모든 오류를 전역 핸들러로 위임합니다.
- **Services (`src/services`)**: 학번 로그인, 비밀번호 해시, 게시글-사용자 매핑 등 도메인 규칙을 처리합니다.
- **Repositories (`src/repos`)**: Sequelize 모델을 호출하여 MySQL과 통신하며, 이미지 업로드는 `multer`를 통해 정적 경로를 반환합니다.
- **Error & Infra (`app.ts`, `server.ts`)**: 미들웨어/정적 자원/글로벌 오류 응답을 담당하고, 서버 기동 시 DB sync를 강제합니다.

**IMPORTANT** for demo purposes I had to disable `helmet` in production. In any real world app you should change these 3 lines of code in `src/server.ts`:
```ts
// eslint-disable-next-line n/no-process-env
if (!process.env.DISABLE_HELMET) {
  app.use(helmet());
}
```

To just this:
```ts
app.use(helmet());
```


## Available Scripts

### `npm run clean-install`

Remove the existing `node_modules/` folder, `package-lock.json`, and reinstall all library modules.


### `npm run dev` or `npm run dev:hot` (hot reloading)

Run the server in development mode.<br/>

**IMPORTANT** development mode uses `swc` for performance reasons which DOES NOT check for typescript errors. Run `npm run type-check` to check for type errors. NOTE: you should use your IDE to prevent most type errors.


### `npm test` or `npm run test:hot` (hot reloading)

Run all unit-tests.


### `npm test -- "name of test file" (i.e. users).`

Run a single unit-test.


### `npm run lint`

Check for linting errors.


### `npm run build`

Build the project for production.


### `npm start`

Run the production build (Must be built first).


### `npm run type-check`

Check for typescript errors.


## 주요 기능

### 게시글 카테고리 기능
게시글에 카테고리 필드를 추가하여 카테고리별 필터링이 가능합니다.

- **지원 카테고리**: `food` (먹거리), `daily` (일상용품), `beauty` (뷰티·패션), `electronics` (전자기기), `school` (학용품), `freemarket` (프리마켓)
- **API 사용 예시**: `GET /api/posts?category=food`
- **상세 문서**: [카테고리 기능 문서](./docs/CATEGORY_FEATURE.md)

### 신뢰점수(Trust Score) 기능
사용자의 공동구매 활동을 기반으로 신뢰도를 수치화한 신뢰점수 시스템입니다.

- **초기 점수**: 회원가입 시 50점
- **점수 범위**: 0 ~ 100점
- **자동 업데이트**: 공동구매 완료/취소, 참여/참여 취소 시 자동으로 점수 조정
- **등급 시스템**: 최우수(90~100), 우수(70~89), 보통(50~69), 주의(30~49), 경고(0~29)
- **API 사용 예시**: `GET /api/users/:id` (trustScore 포함)
- **상세 문서**: [신뢰점수 기능 문서](./docs/TRUST_SCORE_FEATURE.md)

## API Documentation (Swagger)

프로젝트에는 Swagger UI가 내장되어 있어 API 문서를 쉽게 확인하고 테스트할 수 있습니다.

### 접근 방법

서버 실행 후 브라우저에서 다음 URL로 접속:

- **로컬 개발**: `http://localhost:3000/api-docs`
- **배포 환경**: `https://your-domain.com/api-docs`

### 배포 환경 설정

배포 환경에서 다른 개발자들이 Swagger 문서를 볼 수 있도록 하려면:

1. **환경 변수 설정** (`.env.production` 또는 배포 환경 설정):
   ```bash
   API_BASE_URL=https://your-api-domain.com
   ```

2. **동적 서버 URL**: 
   - `API_BASE_URL`이 설정되지 않으면, Swagger는 요청하는 서버의 현재 URL을 자동으로 사용합니다.
   - 배포된 서버에서 `https://your-domain.com/api-docs`로 접속하면 자동으로 해당 URL이 서버 URL로 설정됩니다.

3. **JSON 스펙 다운로드**:
   - `/api-docs.json` 엔드포인트에서 OpenAPI JSON 스펙을 다운로드할 수 있습니다.

### Swagger에서 할 수 있는 것

- 모든 API 엔드포인트 목록 확인
- 각 API의 요청/응답 스키마 확인
- "Try it out" 버튼으로 API 직접 테스트
- 인증이 필요한 경우 (향후 구현 시) 인증 토큰 설정

## Additional Notes

- If `npm run dev` gives you issues with bcrypt on MacOS you may need to run: `npm rebuild bcrypt --build-from-source`. 
