# 사용자 프로필 이미지 API 기능 개발 보고서

## 1. 작업 시점

```text
2026-06-01
브랜치: feature/user-profile-image-api
관련 커밋: <Feat> 사용자 프로필 이미지 API 추가
```

## 2. 문제 배경

```text
기존 문제:
이미지 업로드 API와 사용자 avatarUrl 수정 API는 있었지만, 프론트가 두 API를 직접 조합해야 했다.

사용자/운영자/프론트엔드 관점의 불편:
마이페이지 프로필 이미지 추가/교체 흐름이 명확한 단일 계약으로 제공되지 않았다.

이번 작업으로 해결하려는 것:
사용자 프로필 이미지 업로드와 avatarUrl 반영을 한 API에서 처리하고, URL 직접 수정과 제거도 명시적으로 지원한다.
```

## 3. 기획 방향

```text
선택한 방향:
POST /api/users/{id}/profile-image로 이미지 파일 업로드와 avatarUrl 반영을 동시에 처리한다.
PUT /api/users/{id}/profile-image로 이미지 파일 교체, avatarUrl 직접 수정, null 제거를 처리한다.

선택하지 않은 대안:
기존 POST /api/upload/image와 PUT /api/users/{id} 조합만 프론트에 안내하는 방식.

선택 이유:
마이페이지 프로필 이미지 작업은 사용자 도메인의 명확한 유스케이스이므로 전용 API가 프론트 구현 부담을 줄인다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
POST /api/upload/image는 이미지 파일만 업로드한다.
PUT /api/users/{id}는 avatarUrl을 포함한 사용자 정보를 수정할 수 있다.

변경 후 구현:
POST /api/users/{id}/profile-image는 파일 업로드와 avatarUrl 저장을 한 번에 처리한다.
PUT /api/users/{id}/profile-image는 파일 교체 또는 avatarUrl 직접 수정/제거를 처리한다.

호환성:
기존 업로드 API와 사용자 수정 API는 유지한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/controllers/user.controller.ts
src/services/UserService.ts
src/routes/users/UserRoutes.ts
src/routes/common/validation/user-schemas.ts
src/config/swagger.ts

핵심 로직:
multer로 업로드된 파일명을 /uploads/images/{filename} 형태의 avatarUrl로 변환한다.
UserService.updateProfileImage가 사용자를 확인하고 avatarUrl만 업데이트한다.
PUT 요청은 multipart/form-data image 또는 JSON avatarUrl/null을 모두 지원한다.

새로 추가된 모델/서비스/라우트:
POST /api/users/{id}/profile-image
PUT /api/users/{id}/profile-image
UserService.updateProfileImage
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
POST /api/users/{id}/profile-image
PUT /api/users/{id}/profile-image

요청 변경:
신규 API 추가

응답 변경:
신규 UserProfileImageResponse 스키마 추가

프론트엔드 수정 필요 여부:
마이페이지 프로필 이미지 추가/교체/제거 화면에서 신규 API를 호출하면 된다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 스키마 변경 없음
신규 테이블: 없음
신규 컬럼: 없음
변경된 관계: 없음
마이그레이션 필요 여부: 없음
ERD 변경 이력 문서: 변경 없음
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
avatarUrl

숨겨야 할 필드:
없음

요청 payload 변경:
프로필 이미지 추가/교체는 multipart/form-data image를 사용한다.
이미지 URL 직접 수정/제거는 JSON avatarUrl을 사용한다.

호출 URL 변경:
POST /api/users/{id}/profile-image
PUT /api/users/{id}/profile-image

주의할 상태값:
avatarUrl이 null이면 프로필 이미지 없음으로 처리한다.
```

## 9. 검증 방법

```bash
node ./node_modules/typescript/lib/tsc.js -p tsconfig.prod.json --noEmit --pretty false
TS_NODE_SWC=false node -r ts-node/register/transpile-only scripts/lint-openapi.ts docs/openapi/openapi.json
git diff --check
```

## 10. 남은 작업

```text
후속 API:
프로필 이미지 파일 삭제 정책이 필요하면 실제 파일 삭제 API를 별도 작업으로 추가한다.

운영/배포 주의점:
업로드 파일은 기존 multer 설정에 따라 src/public/uploads/images에 저장된다.

테스트 보강:
프로필 이미지 업로드/수정 컨트롤러 단위 테스트를 추가할 수 있다.

문서 보강:
배포 후 Swagger에서 multipart/form-data 업로드를 확인한다.
```
