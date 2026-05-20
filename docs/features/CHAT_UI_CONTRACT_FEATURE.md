# 채팅 UI 응답 계약 보강 개발 보고서

## 1. 작업 시점

```text
2026-05-20
브랜치: feature/chat-ui-contract
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
채팅방 목록 응답은 채팅 탭 카드에 필요한 게시글 상태, 수령 장소, 마감일, 썸네일, 마지막 메시지 타입을 충분히 제공하지 않았다.
메시지 목록 응답도 배열 중심이라 total, limit, offset, hasNext를 공통 목록 패턴으로 다루기 어려웠다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드가 채팅 목록 카드와 채팅 상세 오버레이를 렌더링하려면 추가 API 호출이나 클라이언트 계산이 필요했다.

이번 작업으로 해결하려는 것:
채팅방 목록과 메시지 목록 응답을 팜플렛 기준 UI 계약에 맞춰 보강한다.
```

## 3. 기획 방향

```text
선택한 방향:
기존 채팅 API path는 유지하고 응답 필드를 확장한다.
메시지 목록은 공통 목록 패턴과 맞게 객체 응답으로 전환한다.
메시지 타입은 system을 추가하되 기존 text, image, file은 유지한다.

선택하지 않은 대안:
채팅 목록 전용 신규 API를 별도로 추가하지 않는다.

선택 이유:
기존 프론트 호출 경로를 유지하면서 UI에 필요한 데이터를 한 번에 제공하는 편이 영향 범위가 작다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/chat/rooms/user/{userId}는 post.title, authorId, images 정도만 제공했다.
lastMessage에는 content, senderId, createdAt만 있었다.
GET /api/chat/rooms/{chatRoomId}/messages는 메시지 배열을 바로 반환했다.
messageType은 text, image, file만 허용했다.

변경 후 구현:
채팅방 목록의 post에 status, pickupLocation, deadline, thumbnailUrl을 추가했다.
lastMessage에 id, messageType을 추가했다.
채팅방 목록과 메시지 목록에 hasNext를 추가했다.
메시지 목록은 { messages, total, limit, offset, hasNext } 형태로 반환한다.
messageType에 system을 추가했다.

호환성:
채팅방 목록 API는 기존 필드를 유지하면서 확장한다.
메시지 목록 API는 배열 응답에서 객체 응답으로 바뀌므로 프론트엔드에서 response.messages를 사용해야 한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/chat.ts
src/models/Message.ts
src/routes/common/validation/chat-schemas.ts
src/repos/ChatRoomRepo.ts
src/repos/MessageRepo.ts
src/services/ChatService.ts
src/controllers/chat.controller.ts
src/routes/chat/ChatRoutes.ts
src/config/swagger.ts
src/app.ts

핵심 로직:
채팅방 목록 응답에 UI 카드 필드를 보강한다.
메시지 목록 조회 시 total과 hasNext를 계산한다.
메시지 생성 후 sender 포함 메시지를 반환한다.
messages.message_type enum에 system을 추가한다.

새로 추가된 모델/서비스/라우트:
신규 라우트는 없다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/chat/rooms/user/{userId}
GET /api/chat/rooms/{chatRoomId}/messages
POST /api/chat/messages

요청 변경:
POST /api/chat/messages message.messageType에 system 허용

응답 변경:
채팅방 목록 post.status, post.pickupLocation, post.deadline, post.thumbnailUrl 추가
채팅방 목록 lastMessage.id, lastMessage.messageType 추가
채팅방 목록 hasNext 추가
메시지 목록 응답을 { messages, total, limit, offset, hasNext }로 변경

프론트엔드 수정 필요 여부:
메시지 목록은 response.messages를 사용해야 한다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: 없음
신규 컬럼: 없음
변경된 관계: 없음
변경된 enum:
messages.message_type에 system 추가

마이그레이션 필요 여부:
서버 시작 시 message_type enum을 확인하고 system을 포함하도록 보강한다.

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
post.thumbnailUrl
post.status
post.pickupLocation
post.deadline
lastMessage.id
lastMessage.messageType
hasNext

숨겨야 할 필드:
없음

요청 payload 변경:
system 메시지를 보내야 하는 경우 messageType=system 사용 가능

호출 URL 변경:
없음

주의할 상태값:
messageType은 text, image, file, system 중 하나다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
curl -s "http://localhost:3000/api/chat/rooms/user/{USER_ID}?limit=20&offset=0"
curl -s "http://localhost:3000/api/chat/rooms/{CHAT_ROOM_ID}/messages?limit=50&offset=0"
```

## 10. 남은 작업

```text
후속 API:
Socket.io 이벤트 이름 정리는 feature/socket-event-contract에서 진행했다.
알림 읽음 처리까지 실시간 반영하려면 notification:read, notification:readAll 이벤트를 추가할 수 있다.

운영/배포 주의점:
messages.message_type enum 확장 반영 여부를 배포 로그에서 확인한다.

테스트 보강:
채팅방 목록 응답 필드, 메시지 목록 페이지네이션, Socket.io 이벤트 alias 테스트.

문서 보강:
프론트엔드 실제 Socket.io 클라이언트 코드가 확정되면 payload 예시를 더 구체화한다.
```
