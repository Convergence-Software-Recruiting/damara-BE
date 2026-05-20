# 알림 action target 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-20
브랜치: feature/notification-action-targets
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
알림 응답에는 postId만 있었고, 채팅 알림이나 시스템 알림처럼 이동 대상이 게시글이 아닌 경우를 표현하기 어려웠다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드가 알림 타입별 이동 경로를 직접 추론해야 했고, 알림 타입 enum도 요구서 기준과 기존 구현이 달랐다.

이번 작업으로 해결하려는 것:
알림 응답에 chatRoomId와 actionUrl을 추가해 알림 클릭 시 이동 대상을 API가 명확히 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
DB는 기존 알림 타입을 읽을 수 있게 유지하고, API 응답은 프론트엔드 요구서 기준 알림 타입으로 정규화한다.

선택하지 않은 대안:
기존 알림 타입을 즉시 삭제하고 DB 데이터를 강제 마이그레이션하는 방식.

선택 이유:
운영 데이터와 로컬 개발 DB의 과거 알림을 깨뜨리지 않으면서 프론트엔드 계약을 새 요구서에 맞출 수 있다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
Notification 응답은 postId 중심이었다.
알림 type enum은 participant_cancel, deadline_soon, post_completed 같은 과거 이름을 사용했다.

변경 후 구현:
Notification 응답에 chatRoomId, actionUrl을 추가했다.
신규 생성 알림은 post_status_changed, trade_completed, trade_cancelled 같은 요구서 기준 타입을 사용한다.
과거 타입은 API 응답에서 신규 타입으로 정규화한다.

호환성:
기존 DB row는 계속 조회 가능하다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/notification.ts
src/models/Notification.ts
src/repos/NotificationRepo.ts
src/services/NotificationService.ts
src/app.ts
src/config/swagger.ts
src/routes/notifications/NotificationRoutes.ts

핵심 로직:
알림 타입 상수와 legacy type 정규화 함수를 추가했다.
알림 생성/조회 응답에 actionUrl을 채운다.
채팅 메시지 전송 시 채팅방 참여자와 게시글 작성자에게 new_chat_message 알림을 생성한다.
notifications 테이블의 chat_room_id, action_url 컬럼을 서버 시작 시 확인한다.

새로 추가된 모델/서비스/라우트:
신규 라우트는 없고 기존 알림 API 응답 계약을 확장했다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/notifications
PATCH /api/notifications/{id}/read

요청 변경:
없음

응답 변경:
Notification.chatRoomId 추가
Notification.actionUrl 추가
GET /api/notifications 응답에 limit, offset, hasNext 추가

프론트엔드 수정 필요 여부:
알림 클릭 이동은 actionUrl을 우선 사용한다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: 없음
신규 컬럼:
notifications.chat_room_id
notifications.action_url

변경된 관계:
notifications.chat_room_id -> chat_rooms.id nullable 관계 추가

마이그레이션 필요 여부:
서버 시작 시 누락 컬럼을 확인하고 추가한다.

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
chatRoomId
actionUrl

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
없음

주의할 상태값:
Swagger에는 신규 알림 타입만 노출한다.
과거 알림 타입은 API 응답에서 신규 타입으로 변환된다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
curl -s "http://localhost:3000/api/notifications?userId={USER_ID}"
```

## 10. 남은 작업

```text
후속 API:
마감 임박 배치에서 post_deadline_soon, favorite_post_deadline_soon 알림 생성 연결.
게시글 모집 완료 상태 전환 시 post_closed 알림 연결.

운영/배포 주의점:
notifications.type enum 확장이 운영 DB에 정상 반영되는지 배포 로그를 확인한다.

테스트 보강:
알림 타입 정규화와 actionUrl 생성 단위 테스트 보강.

문서 보강:
프론트엔드 화면 이동 규칙이 확정되면 actionUrl path 형식을 문서에 고정한다.
```
