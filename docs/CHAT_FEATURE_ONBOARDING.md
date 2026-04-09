# 채팅 기능 구현 온보딩 가이드

## 📋 목차

1. [개요](#개요)
2. [데이터베이스 설계](#데이터베이스-설계)
3. [구현 단계별 설명](#구현-단계별-설명)
4. [API 엔드포인트](#api-엔드포인트)
5. [사용 예시](#사용-예시)
6. [파일 구조](#파일-구조)

---

## 개요

공동구매 플랫폼에 채팅 기능을 추가했습니다. 각 게시글(Post)마다 하나의 채팅방이 생성되며, 사용자들이 메시지를 주고받을 수 있습니다.

### 주요 기능

- ✅ 게시글별 채팅방 생성
- ✅ 텍스트/이미지/파일 메시지 전송
- ✅ 메시지 읽음 처리
- ✅ 미읽음 메시지 수 조회
- ✅ 채팅방 및 메시지 삭제

---

## 데이터베이스 설계

### 테이블 구조

#### 1. `chat_rooms` 테이블

```sql
CREATE TABLE chat_rooms (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  post_id VARCHAR(36) NOT NULL UNIQUE,   -- posts.id (외래키)
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

**특징:**

- 하나의 Post당 하나의 채팅방만 존재 (1:1 관계)
- Post 삭제 시 채팅방도 자동 삭제 (CASCADE)

#### 2. `messages` 테이블

```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,                    -- UUID
  chat_room_id VARCHAR(36) NOT NULL,              -- chat_rooms.id (외래키)
  sender_id VARCHAR(36) NOT NULL,                 -- users.id (외래키)
  content TEXT NOT NULL,                           -- 메시지 내용
  message_type ENUM('text', 'image', 'file') DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,                  -- 읽음 여부
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**특징:**

- 하나의 채팅방에 여러 메시지 (ChatRoom ↔ Message: 1:N 관계)
- 하나의 사용자가 여러 메시지를 보낼 수 있음 (User ↔ Message: 1:N 관계)
- 채팅방 삭제 시 메시지도 자동 삭제 (CASCADE)
- 사용자 삭제 시 메시지도 자동 삭제 (CASCADE)

### 관계도

```
Post (게시글)
  └── ChatRoom (채팅방) - 1:1 관계
        └── Message (메시지들) - 1:N 관계
              └── User (발신자) - N:1 관계 (하나의 User는 여러 Message를 보낼 수 있음, 1:N)
```

**관계 상세:**

- **Post ↔ ChatRoom**: 1:1 (하나의 게시글당 하나의 채팅방)
- **ChatRoom ↔ Message**: 1:N (하나의 채팅방에 여러 메시지)
- **User ↔ Message**: 1:N (하나의 사용자가 여러 메시지를 보낼 수 있음)

---

## 구현 단계별 설명

### Step 1: 모델 정의 (Models)

#### 1.1 ChatRoom 모델 (`src/models/ChatRoom.ts`)

**역할:** 채팅방 데이터 구조 정의

**주요 내용:**

- `ChatRoomAttributes`: TypeScript 타입 정의
- `ChatRoomModel`: Sequelize 모델 클래스
- `PostModel`과의 관계 설정 (`belongsTo`, `hasOne`)

**핵심 코드:**

```typescript
ChatRoomModel.belongsTo(PostModel, {
  foreignKey: "postId",
  as: "post",
});

PostModel.hasOne(ChatRoomModel, {
  foreignKey: "postId",
  as: "chatRoom",
});
```

#### 1.2 Message 모델 (`src/models/Message.ts`)

**역할:** 메시지 데이터 구조 정의

**주요 내용:**

- `MessageAttributes`: TypeScript 타입 정의
- `MessageModel`: Sequelize 모델 클래스
- `ChatRoomModel`, `UserModel`과의 관계 설정

**핵심 코드:**

```typescript
// Message → ChatRoom (N:1 관계)
MessageModel.belongsTo(ChatRoomModel, {
  foreignKey: "chatRoomId",
  as: "chatRoom",
});

// Message → User (N:1 관계)
MessageModel.belongsTo(UserModel, {
  foreignKey: "senderId",
  as: "sender",
});

// ChatRoom → Message (1:N 관계)
ChatRoomModel.hasMany(MessageModel, {
  foreignKey: "chatRoomId",
  as: "messages",
});

// User → Message (1:N 관계) - 하나의 사용자가 여러 메시지를 보낼 수 있음
UserModel.hasMany(MessageModel, {
  foreignKey: "senderId",
  as: "sentMessages",
});
```

---

### Step 2: Repository 레이어 (`src/repos/`)

**역할:** 데이터베이스 직접 접근 로직

#### 2.1 ChatRoomRepo (`src/repos/ChatRoomRepo.ts`)

**주요 메서드:**

- `create()` - 채팅방 생성 (Post 존재 확인 포함)
- `findById()` - ID로 채팅방 조회
- `findByPostId()` - Post ID로 채팅방 조회
- `delete()` - 채팅방 삭제

**에러 처리:**

- `POST_NOT_FOUND`: Post가 존재하지 않을 때
- `CHAT_ROOM_ALREADY_EXISTS`: 이미 채팅방이 존재할 때

#### 2.2 MessageRepo (`src/repos/MessageRepo.ts`)

**주요 메서드:**

- `create()` - 메시지 생성
- `findById()` - ID로 메시지 조회 (발신자 정보 포함)
- `findByChatRoomId()` - 채팅방의 모든 메시지 조회 (페이징)
- `countUnreadMessages()` - 읽지 않은 메시지 수 조회
- `markAsRead()` - 메시지 읽음 처리
- `markAllAsRead()` - 채팅방의 모든 메시지 읽음 처리
- `delete()` - 메시지 삭제

**특징:**

- `include`를 사용하여 발신자(User) 정보도 함께 조회
- 본인이 보낸 메시지는 읽음 처리에서 제외

---

### Step 3: Service 레이어 (`src/services/ChatService.ts`)

**역할:** 비즈니스 로직 처리

**주요 메서드:**

- `createChatRoom()` - 채팅방 생성
- `getOrCreateChatRoomByPostId()` - Post ID로 채팅방 조회 또는 생성
- `getChatRoomById()` - 채팅방 조회
- `sendMessage()` - 메시지 전송 (채팅방, 발신자 존재 확인)
- `getMessagesByChatRoomId()` - 메시지 목록 조회
- `markMessageAsRead()` - 메시지 읽음 처리
- `markAllMessagesAsRead()` - 전체 읽음 처리
- `getUnreadMessageCount()` - 미읽음 수 조회
- `deleteChatRoom()` - 채팅방 삭제
- `deleteMessage()` - 메시지 삭제

**에러 처리:**

- `CHAT_ROOM_NOT_FOUND`: 채팅방이 존재하지 않을 때
- `SENDER_NOT_FOUND`: 발신자가 존재하지 않을 때

---

### Step 4: Validation 스키마 (`src/routes/common/validation/chat-schemas.ts`)

**역할:** 요청 데이터 검증 (Zod 사용)

**스키마:**

- `createChatRoomSchema`: 채팅방 생성 요청 검증
- `createMessageSchema`: 메시지 전송 요청 검증
- `updateMessageSchema`: 메시지 수정 요청 검증

**예시:**

```typescript
export const createMessageSchema = z.object({
  message: z.object({
    chatRoomId: z.string().uuid(),
    senderId: z.string().uuid(),
    content: z.string().min(1),
    messageType: z.enum(["text", "image", "file"]).optional().default("text"),
  }),
});
```

---

### Step 5: Controller 레이어 (`src/controllers/chat.controller.ts`)

**역할:** HTTP 요청 처리 및 응답

**주요 함수:**

- `createChatRoom()` - POST `/api/chat/rooms`
- `getOrCreateChatRoomByPostId()` - GET `/api/chat/rooms/post/:postId`
- `getChatRoomById()` - GET `/api/chat/rooms/:id`
- `sendMessage()` - POST `/api/chat/messages`
- `getMessagesByChatRoomId()` - GET `/api/chat/rooms/:chatRoomId/messages`
- `markMessageAsRead()` - PATCH `/api/chat/messages/:id/read`
- `markAllMessagesAsRead()` - PATCH `/api/chat/rooms/:chatRoomId/read-all`
- `getUnreadMessageCount()` - GET `/api/chat/rooms/:chatRoomId/unread-count`
- `deleteChatRoom()` - DELETE `/api/chat/rooms/:id`
- `deleteMessage()` - DELETE `/api/chat/messages/:id`

**처리 흐름:**

1. 요청 데이터 검증 (`parseReq`)
2. Service 호출
3. 성공 응답 또는 에러 전달 (`next(error)`)

---

### Step 6: Routes 정의 (`src/routes/chat/ChatRoutes.ts`)

**역할:** API 엔드포인트와 Controller 연결

**Swagger 문서화:**

- 각 엔드포인트에 대한 Swagger JSDoc 주석 추가
- 요청/응답 스키마 정의
- 예시 데이터 제공

**라우터 등록:**

```typescript
// src/routes/index.ts
import chatRouter from "./chat/ChatRoutes";
BaseRouter.use(Paths.Chat.Base, chatRouter); // /api/chat
```

---

### Step 7: Swagger 스키마 추가 (`src/config/swagger.ts`)

**역할:** API 문서에 ChatRoom, Message 스키마 추가

**추가된 스키마:**

- `ChatRoom`: 채팅방 스키마 정의
- `Message`: 메시지 스키마 정의 (발신자 정보 포함)

---

### Step 8: Paths 상수 추가 (`src/common/constants/Paths.ts`)

**추가 내용:**

```typescript
Chat: {
  Base: "/chat",
}
```

---

## API 엔드포인트

### 채팅방 관련

| Method | Endpoint                       | 설명                       |
| ------ | ------------------------------ | -------------------------- |
| POST   | `/api/chat/rooms`              | 채팅방 생성                |
| GET    | `/api/chat/rooms/post/:postId` | Post ID로 채팅방 조회/생성 |
| GET    | `/api/chat/rooms/:id`          | 채팅방 ID로 조회           |
| DELETE | `/api/chat/rooms/:id`          | 채팅방 삭제                |

### 메시지 관련

| Method | Endpoint                                   | 설명             |
| ------ | ------------------------------------------ | ---------------- |
| POST   | `/api/chat/messages`                       | 메시지 전송      |
| GET    | `/api/chat/rooms/:chatRoomId/messages`     | 메시지 목록 조회 |
| PATCH  | `/api/chat/messages/:id/read`              | 메시지 읽음 처리 |
| PATCH  | `/api/chat/rooms/:chatRoomId/read-all`     | 전체 읽음 처리   |
| GET    | `/api/chat/rooms/:chatRoomId/unread-count` | 미읽음 수 조회   |
| DELETE | `/api/chat/messages/:id`                   | 메시지 삭제      |

---

## 사용 예시

### 1. 채팅방 생성

**요청:**

```bash
POST /api/chat/rooms
Content-Type: application/json

{
  "chatRoom": {
    "postId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**응답:**

```json
{
  "id": "chat-room-uuid",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2025-11-27T10:00:00.000Z",
  "updatedAt": "2025-11-27T10:00:00.000Z"
}
```

### 2. 메시지 전송

**요청:**

```bash
POST /api/chat/messages
Content-Type: application/json

{
  "message": {
    "chatRoomId": "chat-room-uuid",
    "senderId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
    "content": "안녕하세요! 공동구매 참여하고 싶습니다.",
    "messageType": "text"
  }
}
```

**응답:**

```json
{
  "id": "message-uuid",
  "chatRoomId": "chat-room-uuid",
  "senderId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
  "content": "안녕하세요! 공동구매 참여하고 싶습니다.",
  "messageType": "text",
  "isRead": false,
  "createdAt": "2025-11-27T10:05:00.000Z",
  "updatedAt": "2025-11-27T10:05:00.000Z"
}
```

### 3. 메시지 목록 조회

**요청:**

```bash
GET /api/chat/rooms/chat-room-uuid/messages?limit=50&offset=0
```

**응답:**

```json
[
  {
    "id": "message-uuid-1",
    "chatRoomId": "chat-room-uuid",
    "senderId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
    "content": "안녕하세요!",
    "messageType": "text",
    "isRead": false,
    "sender": {
      "id": "a87522bd-bc79-47b0-a73f-46ea4068a158",
      "nickname": "홍길동",
      "avatarUrl": "https://example.com/avatar.jpg",
      "studentId": "20241234"
    },
    "createdAt": "2025-11-27T10:05:00.000Z",
    "updatedAt": "2025-11-27T10:05:00.000Z"
  }
]
```

### 4. 메시지 읽음 처리

**요청:**

```bash
PATCH /api/chat/messages/message-uuid/read
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

### 5. 미읽음 메시지 수 조회

**요청:**

```bash
GET /api/chat/rooms/chat-room-uuid/unread-count?userId=user-uuid
```

**응답:**

```json
{
  "unreadCount": 5
}
```

---

## 파일 구조

```
src/
├── models/
│   ├── ChatRoom.ts          # 채팅방 모델
│   └── Message.ts           # 메시지 모델
├── repos/
│   ├── ChatRoomRepo.ts      # 채팅방 Repository
│   └── MessageRepo.ts       # 메시지 Repository
├── services/
│   └── ChatService.ts       # 채팅 비즈니스 로직
├── controllers/
│   └── chat.controller.ts   # 채팅 HTTP 컨트롤러
├── routes/
│   ├── chat/
│   │   └── ChatRoutes.ts    # 채팅 라우트 정의
│   └── common/
│       └── validation/
│           └── chat-schemas.ts  # 채팅 검증 스키마
└── config/
    └── swagger.ts           # Swagger 스키마 추가
```

---

## 아키텍처 흐름

```
HTTP Request
    ↓
Routes (ChatRoutes.ts)
    ↓
Controller (chat.controller.ts)
    ↓ [검증: parseReq]
Service (ChatService.ts)
    ↓ [비즈니스 로직]
Repository (ChatRoomRepo.ts, MessageRepo.ts)
    ↓ [DB 접근]
Model (ChatRoom.ts, Message.ts)
    ↓
Database (MySQL)
```

---

## 주의사항

1. **인증 미들웨어 미구현**

   - 현재 `userId`는 요청 body나 query에서 직접 받고 있음
   - 실제 프로덕션에서는 JWT 토큰 등으로 인증된 사용자 정보를 가져와야 함

2. **권한 검증 필요**

   - 채팅방 접근 권한 확인 (게시글 작성자 또는 참여자만)
   - 메시지 삭제 권한 확인 (본인 메시지만 삭제 가능)

3. **실시간 통신**

   - 현재는 REST API만 구현됨
   - 실시간 채팅을 위해서는 WebSocket (Socket.io) 추가 필요

4. **데이터베이스 마이그레이션**
   - `npm run dev` 실행 시 Sequelize가 자동으로 테이블 생성
   - 프로덕션 환경에서는 마이그레이션 스크립트 사용 권장

---

## WebSocket 실시간 통신

### 구현 완료 ✅

Socket.io를 사용한 실시간 채팅 기능이 구현되었습니다.

**주요 기능:**

- 실시간 메시지 전송/수신
- 채팅방별 룸(Room) 관리
- 사용자 입장/퇴장 알림
- 메시지 읽음 처리
- 자동 재연결 지원

**파일 구조:**

```
src/
├── config/
│   └── socket.ts          # Socket.io 서버 설정
└── server.ts              # HTTP 서버 + Socket.io 통합
```

**사용 방법:**
자세한 내용은 [WEBSOCKET_GUIDE.md](./WEBSOCKET_GUIDE.md)를 참고하세요.

**클라이언트 연결 예시:**

```javascript
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  socket.emit("join_chat_room", {
    chatRoomId: "chat-room-uuid",
    userId: "user-uuid",
  });
});

socket.on("receive_message", (message) => {
  console.log("메시지 수신:", message);
});

socket.emit("send_message", {
  chatRoomId: "chat-room-uuid",
  senderId: "user-uuid",
  content: "안녕하세요!",
  messageType: "text",
});
```

---

## 다음 단계 (향후 개선 사항)

- [x] WebSocket 실시간 통신 구현 ✅
- [ ] JWT 인증 미들웨어 추가
- [ ] 채팅방 접근 권한 검증
- [ ] Socket.io 미들웨어에서 토큰 검증
- [ ] 이미지/파일 업로드 기능 연동
- [ ] 메시지 알림 기능
- [ ] 채팅방 목록 조회 API
- [ ] 사용자별 채팅방 목록 조회 API

---

## 참고 자료

- [Sequelize 공식 문서](https://sequelize.org/)
- [Express.js 공식 문서](https://expressjs.com/)
- [Zod 공식 문서](https://zod.dev/)
- [Swagger/OpenAPI 스펙](https://swagger.io/specification/)
