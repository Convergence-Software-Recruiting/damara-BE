# Socket.io 이벤트 계약 정리 보고서

## 1. 작업 시점

```text
2026-05-20
브랜치: feature/socket-event-contract
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
Socket.io 이벤트 이름이 join_chat_room, send_message처럼 화면별 구현 중심으로 되어 있어 팜플렛 기준 채팅/알림 이벤트 계약과 맞지 않았다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드가 REST API는 UI 계약 기준으로 정리된 반면, WebSocket 이벤트는 별도 레거시 이름을 알아야 했다.

이번 작업으로 해결하려는 것:
chat:join, chat:send, chat:read, notification:new 기준의 이벤트 계약을 서버와 문서에 반영한다.
```

## 3. 기획 방향

```text
선택한 방향:
신규 네임스페이스형 이벤트를 추가하고 기존 레거시 이벤트는 호환 alias로 유지한다.

선택하지 않은 대안:
기존 이벤트를 즉시 제거하지 않았다.

선택 이유:
현재 데모 페이지와 기존 클라이언트를 깨지 않으면서 프론트엔드 신규 화면은 팜플렛 기준 이벤트로 전환할 수 있다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
클라이언트 emit 이벤트는 join_chat_room, send_message, mark_message_read, leave_chat_room이었다.
서버 수신 이벤트는 receive_message, user_joined, user_left, message_read였다.

변경 후 구현:
클라이언트 emit 이벤트로 chat:join, chat:send, chat:read, chat:leave, notification:subscribe를 지원한다.
서버 수신 이벤트로 chat:message, chat:joined, chat:left, chat:read, notification:new, socket:error를 지원한다.

호환성:
기존 레거시 이벤트도 계속 지원한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/config/socket.ts
src/config/socketRegistry.ts
src/services/NotificationService.ts
src/views/chat.html

핵심 로직:
Socket.io 핸들러를 재사용 가능한 함수로 분리하고 신규 이벤트명과 레거시 이벤트명을 같은 핸들러에 연결했다.
사용자별 알림 룸 user:{userId}를 추가하고 알림 생성 시 notification:new 이벤트를 발행한다.

새로 추가된 모델/서비스/라우트:
신규 DB 모델이나 REST 라우트는 없다.
Socket.io 인스턴스와 알림 emit을 관리하는 socketRegistry를 추가했다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: Socket.io 이벤트 계약
요청 변경: REST 요청 변경 없음
응답 변경: REST 응답 변경 없음
프론트엔드 수정 필요 여부: 신규 WebSocket 클라이언트는 chat:* 이벤트를 사용한다.
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
notification:new payload 전체

숨겨야 할 필드:
없음

요청 payload 변경:
Socket emit 이름 변경. payload 구조는 기존과 동일하다.

호출 URL 변경:
없음

주의할 상태값:
기존 이벤트도 동작하지만 신규 화면은 chat:*와 notification:* 기준으로 맞춘다.
```

## 9. 검증 방법

```bash
npm run build
```

수동 검증:

```text
Socket.io 클라이언트에서 chat:join 후 chat:send를 emit하면 chat:message를 수신한다.
notification:subscribe 후 서버에서 알림이 생성되면 notification:new를 수신한다.
```

## 10. 남은 작업

```text
후속 API:
알림 읽음 처리 실시간 반영은 feature/notification-read-events에서 진행했다.
알림 삭제 실시간 반영은 feature/notification-delete-event에서 진행했다.
알림 보관/복구 기능이 필요하면 archive 이벤트를 별도로 설계한다.

운영/배포 주의점:
기존 클라이언트가 레거시 이벤트를 쓰고 있어도 즉시 깨지지 않는다.

테스트 보강:
Socket.io 이벤트 alias, notification:new, notification:read, notification:readAll, notification:delete emit에 대한 통합 테스트를 추가할 수 있다.

문서 보강:
프론트엔드 실제 사용 코드가 확정되면 이벤트별 payload 예시를 더 구체화한다.
```
