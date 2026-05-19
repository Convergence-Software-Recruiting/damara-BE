# 사용자 설정 API 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-19
브랜치: feature/user-settings-api
관련 커밋: 작업 후 기록
```

## 2. 문제 배경

```text
기존 문제:
마이페이지 설정 화면의 알림 토글과 방해금지 시간 설정이 프론트 로컬 상태 또는 목데이터에 머물러 있었다.

사용자/운영자/프론트엔드 관점의 불편:
앱을 재실행하거나 다른 기기에서 로그인하면 설정이 유지되지 않는다.
프론트엔드가 설정 저장 성공/실패를 서버 기준으로 판단할 수 없다.

이번 작업으로 해결하려는 것:
사용자별 설정을 user_settings 테이블에 저장하고, 조회/수정 API를 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
Users 도메인 아래에 GET/PUT /api/users/{id}/settings를 추가한다.
GET 호출 시 설정이 없으면 기본 설정 row를 생성해 반환한다.
PUT은 settings 객체의 전달된 필드만 부분 업데이트한다.

선택하지 않은 대안:
사용자 테이블에 설정 컬럼을 직접 추가하지 않는다.
공지/FAQ 같은 정적 서비스 화면과 설정 API를 한 작업에 섞지 않는다.

선택 이유:
설정은 사용자당 하나의 독립 데이터이고, 향후 알림 세부 설정이 늘어날 가능성이 있어 별도 테이블이 더 안전하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
사용자 설정을 저장하는 DB 구조와 API가 없었다.

변경 후 구현:
user_settings 테이블이 추가된다.
GET /api/users/{id}/settings로 설정을 조회한다.
PUT /api/users/{id}/settings로 설정을 저장한다.

호환성:
기존 API는 변경하지 않는다.
설정이 없는 기존 사용자도 GET 호출 시 기본값을 생성하므로 별도 선행 작업 없이 사용할 수 있다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/models/UserSettings.ts
src/repos/UserSettingsRepo.ts
src/services/UserSettingsService.ts
src/controllers/user.controller.ts
src/routes/users/UserRoutes.ts
src/routes/common/validation/user-schemas.ts
src/app.ts
src/config/swagger.ts

핵심 로직:
UserSettingsService가 사용자 존재를 확인한 뒤 설정 조회/생성을 처리한다.
PUT 요청은 Zod 스키마로 boolean 필드와 HH:mm 시간 형식을 검증한다.
서버 시작 시 user_settings 테이블을 확인하고 없으면 생성한다.

새로 추가된 모델/서비스/라우트:
UserSettingsModel
UserSettingsRepo
UserSettingsService
GET /api/users/{id}/settings
PUT /api/users/{id}/settings
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/users/{id}/settings
PUT /api/users/{id}/settings

요청 변경:
PUT 요청에 settings 객체를 사용한다.

응답 변경:
UserSettings 스키마를 반환한다.

프론트엔드 수정 필요 여부:
마이페이지 설정 화면은 신규 API로 초기값을 불러오고 저장할 수 있다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: user_settings
신규 컬럼:
id
user_id
push_enabled
chat_notification_enabled
post_notification_enabled
marketing_notification_enabled
quiet_hours_enabled
quiet_hours_start
quiet_hours_end
created_at
updated_at

변경된 관계:
users 1 : 0..1 user_settings

마이그레이션 필요 여부:
운영 DB에 user_settings 테이블 생성 필요

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
pushEnabled
chatNotificationEnabled
postNotificationEnabled
marketingNotificationEnabled
quietHoursEnabled
quietHoursStart
quietHoursEnd

숨겨야 할 필드:
DB 내부 id, userId, createdAt, updatedAt은 응답하지 않는다.

요청 payload 변경:
PUT /api/users/{id}/settings body.settings에 변경할 필드를 전달한다.

호출 URL 변경:
설정 화면 진입 시 GET /api/users/{id}/settings
설정 변경 저장 시 PUT /api/users/{id}/settings

주의할 상태값:
quietHoursStart와 quietHoursEnd는 HH:mm 형식이어야 한다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
```

로컬 서버 실행 후 확인:

```bash
curl -s "http://localhost:3000/api/users/{id}/settings"
curl -s -X PUT "http://localhost:3000/api/users/{id}/settings" \
  -H "Content-Type: application/json" \
  -d '{"settings":{"quietHoursEnabled":true,"quietHoursStart":"23:00","quietHoursEnd":"08:00"}}'
```

## 10. 남은 작업

```text
후속 API:
공지사항 API
FAQ API
알림 타입/action target 보강

운영/배포 주의점:
DB에 user_settings 테이블이 필요하다.
서버 시작 시 보정 로직이 있지만 운영 반영 SQL을 별도로 검토하는 편이 안전하다.

테스트 보강:
기본 설정 생성, 부분 업데이트, HH:mm 검증 실패 케이스를 자동화할 수 있다.

문서 보강:
프론트 설정 화면의 실제 토글명이 바뀌면 Swagger description을 맞춰 조정한다.
```
