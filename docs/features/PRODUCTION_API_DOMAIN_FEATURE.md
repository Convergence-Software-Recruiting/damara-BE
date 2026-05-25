# 운영 API 도메인 정리 개발 보고서

## 1. 작업 시점

```text
2026-05-25
브랜치: feature/post-exceptions-api
관련 커밋: 예정
```

## 2. 문제 배경

```text
기존 문제:
프론트엔드가 https://damara.bluerack.org/api 를 API base URL로 사용했지만,
해당 도메인의 /api 요청은 백엔드가 아니라 Vercel 프론트 배포로 전달되어 404가 발생했다.

사용자/운영자/프론트엔드 관점의 불편:
운영 프론트에서 정상적인 API 요청이 Vercel 404로 실패했고,
Swagger UI에도 http 자동 감지 서버와 https 설정 서버가 함께 노출되어 운영 기준 URL이 혼동될 수 있었다.

이번 작업으로 해결하려는 것:
운영 API base URL을 https://be.damara.bluerack.org/api 기준으로 정리하고,
Swagger/OpenAPI와 배포 기본 환경변수가 같은 도메인을 가리키도록 맞춘다.
```

## 3. 기획 방향

```text
선택한 방향:
프론트엔드는 be 서브도메인을 백엔드 전용 도메인으로 사용한다.
백엔드 Swagger는 API_BASE_URL이 설정되어 있으면 해당 URL을 첫 번째 서버로 노출한다.

선택하지 않은 대안:
Vercel의 damara.bluerack.org /api/* 요청을 백엔드로 rewrite하는 방식은 이번 범위에서 제외했다.

선택 이유:
프론트 도메인과 백엔드 도메인을 분리하면 라우팅 책임이 명확하고,
Vercel rewrite 설정 변경 없이 API 서버를 직접 확인할 수 있다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
OpenAPI 스냅샷의 운영 서버 URL은 https://damara.bluerack.org 였다.
deploy.sh의 기본 API_BASE_URL은 http://13.124.135.212:3000 이었다.
런타임 Swagger는 현재 요청 URL을 먼저 노출하고, 설정 URL을 두 번째로 노출했다.

변경 후 구현:
OpenAPI 스냅샷의 운영 서버 URL은 https://be.damara.bluerack.org 이다.
deploy.sh의 기본 API_BASE_URL은 https://be.damara.bluerack.org 이다.
기존 .env가 있더라도 deploy.sh가 API_BASE_URL만 be 도메인으로 보정한다.
런타임 Swagger는 API_BASE_URL이 설정되어 있으면 설정 URL을 먼저 노출한다.

호환성:
REST endpoint path 자체는 유지된다.
운영 프론트는 base URL만 be 서브도메인 기준으로 바꾸면 된다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/common/constants/ENV.ts
src/config/swagger.ts
scripts/export-openapi.ts
deploy.sh
docs/openapi/openapi.json
README.md
docs/README.md
docs/api/SWAGGER_CHANGELOG.md

핵심 로직:
API_BASE_URL 설정 여부를 ENV에 노출하고,
Swagger 런타임 servers 배열에서 설정 URL을 자동 감지 URL보다 우선한다.

새로 추가된 모델/서비스/라우트:
없음
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: REST path 변경 없음, OpenAPI servers 운영 URL 변경
요청 변경: 없음
응답 변경: 없음
프론트엔드 수정 필요 여부: 있음, 운영 API base URL을 https://be.damara.bluerack.org/api 로 변경
Swagger 변경 이력 문서: docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 없음
신규 테이블: 없음
신규 컬럼: 없음
변경된 관계: 없음
마이그레이션 필요 여부: 없음
ERD 변경 이력 문서: 해당 없음
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드: 없음
숨겨야 할 필드: 없음
요청 payload 변경: 없음
호출 URL 변경:
  VITE_API_BASE_URL=https://be.damara.bluerack.org/api
  VITE_API_BASE=https://be.damara.bluerack.org
  VITE_API_URL=https://be.damara.bluerack.org/api
주의할 상태값:
base URL에 /api가 포함된 경우 endpoint에는 /posts, /users처럼 리소스 path만 붙인다.
```

## 9. 검증 방법

```bash
npm run openapi:generate
npm run openapi:lint
npm run build
curl -s https://be.damara.bluerack.org/api/posts?limit=1
```

## 10. 남은 작업

```text
후속 API: 없음
운영/배포 주의점:
be.damara.bluerack.org에 유효한 HTTPS 인증서를 발급하고 Nginx에 적용해야 한다.
인증서 적용 전까지 브라우저의 https://be.damara.bluerack.org 요청은 SSL 오류가 날 수 있다.

테스트 보강:
서버 배포 후 /api-docs.json servers 값과 /api/posts 응답을 재확인한다.

문서 보강:
운영 Nginx 설정 파일을 저장소에서 관리하게 되면 인증서/프록시 설정 예시를 추가한다.
```
