# 알림 읽음 Socket 이벤트 보고서

## 1. 작업 시점

```text
2026-05-21
브랜치: feature/notification-read-events
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
notification:new 이벤트는 추가되었지만 알림 읽음 처리 결과는 REST 응답으로만 확인할 수 있었다.

사용자/운영자/프론트엔드 관점의 불편:
알림 모달, 헤더 배지, 마이페이지 알림 영역이 동시에 열려 있을 때 읽음 상태를 실시간으로 맞추기 어렵다.

이번 작업으로 해결하려는 것:
단일 알림 읽음과 전체 알림 읽음 처리 결과를 Socket.io 이벤트로 사용자 알림 룸에 브로드캐스트한다.
```

## 3. 기획 방향

```text
선택한 방향:
REST 읽음 처리와 Socket 이벤트 읽음 처리가 모두 NotificationService를 거치게 하고, 서비스에서 notification:read 및 notification:readAll 이벤트를 발행한다.

선택하지 않은 대안:
Socket 핸들러에서만 이벤트를 발행하지 않았다.

선택 이유:
REST API로 읽음 처리한 경우에도 다른 화면/탭이 같은 이벤트를 받을 수 있어야 한다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
PATCH /api/notifications/{id}/read와 PATCH /api/notifications/read-all은 DB 업데이트 후 REST 응답만 반환했다.

변경 후 구현:
REST 읽음 처리와 Socket 읽음 처리 모두 사용자 룸 user:{userId}에 실시간 이벤트를 발행한다.

호환성:
REST API 계약은 바뀌지 않는다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/config/socket.ts
src/config/socketRegistry.ts
src/services/NotificationService.ts

핵심 로직:
notification:read, notification:readAll Socket 이벤트를 추가했다.
NotificationService.markAsRead와 markAllAsRead가 처리 결과를 사용자 알림 룸에 emit한다.

새로 추가된 모델/서비스/라우트:
신규 REST 라우트나 DB 모델은 없다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: Socket.io 이벤트 계약
요청 변경: REST 요청 변경 없음
응답 변경: REST 응답 변경 없음
프론트엔드 수정 필요 여부: 알림 실시간 동기화를 위해 notification:read, notification:readAll 수신 처리 추가 권장
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
새로 표시할 필드:
notification:read는 읽음 처리된 notification 객체를 반환한다.
notification:readAll은 userId, updatedCount를 반환한다.

숨겨야 할 필드:
없음

요청 payload 변경:
Socket emit으로 notification:read, notification:readAll을 사용할 수 있다.

호출 URL 변경:
없음

주의할 상태값:
notification:read payload의 isRead는 true다.
```

## 9. 검증 방법

```bash
npm run build
```

수동 검증:

```text
notification:subscribe 후 notification:read를 emit하면 notification:read 이벤트를 수신한다.
notification:subscribe 후 notification:readAll을 emit하면 notification:readAll 이벤트를 수신한다.
REST PATCH /api/notifications/{id}/read도 같은 notification:read 이벤트를 발행한다.
```

## 10. 남은 작업

```text
후속 API:
알림 삭제 실시간 동기화는 feature/notification-delete-event에서 진행했다.
알림 보관/복구 기능이 필요하면 archive 이벤트를 별도로 설계한다.

운영/배포 주의점:
DB 변경은 없다.

테스트 보강:
Socket 이벤트와 REST 읽음/삭제 처리의 emit 동작을 통합 테스트로 추가할 수 있다.

문서 보강:
프론트엔드 실제 알림 상태 관리 코드가 확정되면 예시를 추가한다.
```
