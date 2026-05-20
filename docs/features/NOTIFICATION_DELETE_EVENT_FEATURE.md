# 알림 삭제 Socket 이벤트 보고서

## 1. 작업 시점

```text
2026-05-21
브랜치: feature/notification-delete-event
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
알림 생성과 읽음 처리는 실시간 이벤트로 동기화할 수 있었지만, 알림 삭제 결과는 REST 응답으로만 확인할 수 있었다.

사용자/운영자/프론트엔드 관점의 불편:
알림 목록이 여러 화면 또는 브라우저 탭에서 열려 있을 때 삭제된 알림이 다른 화면에 남아 있을 수 있다.

이번 작업으로 해결하려는 것:
알림 삭제 성공 결과를 notification:delete 이벤트로 사용자 알림 룸에 브로드캐스트한다.
```

## 3. 기획 방향

```text
선택한 방향:
REST 삭제와 Socket 삭제 모두 NotificationService.deleteNotification을 거치게 하고, 서비스에서 notification:delete 이벤트를 발행한다.

선택하지 않은 대안:
Socket 핸들러에서만 삭제 이벤트를 발행하지 않았다.

선택 이유:
REST API로 삭제한 경우에도 헤더 배지, 알림 모달, 다른 탭이 같은 이벤트를 받을 수 있어야 한다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
DELETE /api/notifications/{id}는 DB 삭제 후 REST 성공 메시지만 반환했다.

변경 후 구현:
REST 삭제와 Socket 삭제 모두 사용자 룸 user:{userId}에 notification:delete 이벤트를 발행한다.

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
notification:delete Socket 이벤트를 추가했다.
NotificationService.deleteNotification이 삭제 성공 후 notificationId와 userId를 사용자 알림 룸에 emit한다.

새로 추가된 모델/서비스/라우트:
신규 REST 라우트나 DB 모델은 없다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: Socket.io 이벤트 계약
요청 변경: REST 요청 변경 없음
응답 변경: REST 응답 변경 없음
프론트엔드 수정 필요 여부: 알림 실시간 동기화를 위해 notification:delete 수신 처리 추가 권장
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
notification:delete는 userId, notificationId를 반환한다.

숨겨야 할 필드:
없음

요청 payload 변경:
Socket emit으로 notification:delete를 사용할 수 있다.

호출 URL 변경:
없음

주의할 상태값:
notification:delete 수신 시 해당 notificationId를 목록과 배지 계산에서 제거한다.
```

## 9. 검증 방법

```bash
npm run build
```

수동 검증:

```text
notification:subscribe 후 notification:delete를 emit하면 notification:delete 이벤트를 수신한다.
REST DELETE /api/notifications/{id}도 같은 notification:delete 이벤트를 발행한다.
```

## 10. 남은 작업

```text
후속 API:
알림 보관/복구 기능이 필요하면 archive 이벤트를 별도로 설계한다.

운영/배포 주의점:
DB 변경은 없다.

테스트 보강:
Socket 이벤트와 REST 삭제 처리의 emit 동작을 통합 테스트로 추가할 수 있다.

문서 보강:
프론트엔드 실제 알림 상태 관리 코드가 확정되면 예시를 추가한다.
```
