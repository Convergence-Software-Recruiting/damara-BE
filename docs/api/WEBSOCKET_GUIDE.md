# WebSocket 실시간 채팅 가이드

## 📋 목차
1. [개요](#개요)
2. [서버 설정](#서버-설정)
3. [클라이언트 연결 방법](#클라이언트-연결-방법)
4. [이벤트 목록](#이벤트-목록)
5. [사용 예시](#사용-예시)
6. [주의사항](#주의사항)

---

## 개요

Socket.io를 사용하여 실시간 채팅 기능을 구현했습니다. REST API와 함께 사용하여 메시지를 실시간으로 주고받을 수 있습니다.

프론트엔드 신규 계약은 네임스페이스형 이벤트를 기준으로 합니다.

```text
chat:join
chat:send
chat:read
chat:leave
chat:message
chat:joined
chat:left
notification:subscribe
notification:new
socket:error
```

기존 데모와 운영 중인 클라이언트를 위해 `join_chat_room`, `send_message`, `mark_message_read`, `leave_chat_room`, `receive_message`, `user_joined`, `user_left`, `message_read`, `error` 이벤트도 당분간 호환됩니다.

### 주요 기능
- ✅ 실시간 메시지 전송/수신
- ✅ 채팅방별 룸(Room) 관리
- ✅ 사용자 입장/퇴장 알림
- ✅ 메시지 읽음 처리
- ✅ 자동 재연결 지원

---

## 서버 설정

### 1. 패키지 설치
```bash
npm install socket.io @types/socket.io
```

### 2. 서버 구조

```
src/
├── config/
│   └── socket.ts          # Socket.io 서버 설정
└── server.ts              # HTTP 서버 + Socket.io 통합
```

### 3. 서버 시작

서버가 시작되면 자동으로 Socket.io가 활성화됩니다:

```bash
npm run dev
# 또는
npm start
```

**로그 확인:**
```
✓ Socket.io 서버 초기화 완료
✓ Socket.io 서버가 활성화되었습니다.
```

---

## 클라이언트 연결 방법

### HTML/JavaScript 예시

```html
<!DOCTYPE html>
<html>
<head>
  <title>실시간 채팅</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <div id="messages"></div>
  <input type="text" id="messageInput" placeholder="메시지를 입력하세요...">
  <button onclick="sendMessage()">전송</button>

  <script>
    // Socket.io 연결
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    const chatRoomId = 'your-chat-room-id';
    const userId = 'your-user-id';

    // 연결 성공
    socket.on('connect', () => {
      console.log('✓ 서버에 연결되었습니다:', socket.id);
      
      // 채팅방 입장
      socket.emit('chat:join', {
        chatRoomId: chatRoomId,
        userId: userId
      });
    });

    // 연결 오류
    socket.on('connect_error', (error) => {
      console.error('✗ 연결 오류:', error);
    });

    // 메시지 수신
    socket.on('chat:message', (message) => {
      console.log('메시지 수신:', message);
      displayMessage(message);
    });

    // 사용자 입장 알림
    socket.on('chat:joined', (data) => {
      console.log('사용자 입장:', data);
    });

    // 사용자 퇴장 알림
    socket.on('chat:left', (data) => {
      console.log('사용자 퇴장:', data);
    });

    // 메시지 읽음 처리 알림
    socket.on('chat:read', (data) => {
      console.log('메시지 읽음:', data);
    });

    // 에러 처리
    socket.on('error', (error) => {
      console.error('에러:', error);
    });

    // 메시지 전송 함수
    function sendMessage() {
      const input = document.getElementById('messageInput');
      const content = input.value.trim();
      
      if (!content) return;

      socket.emit('chat:send', {
        chatRoomId: chatRoomId,
        senderId: userId,
        content: content,
        messageType: 'text'
      });

      input.value = '';
    }

    // 메시지 표시 함수
    function displayMessage(message) {
      const messagesDiv = document.getElementById('messages');
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <strong>${message.sender?.nickname || '알 수 없음'}</strong>: 
        ${message.content}
        <small>(${new Date(message.createdAt).toLocaleTimeString()})</small>
      `;
      messagesDiv.appendChild(messageElement);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // 채팅방 나가기
    function leaveChatRoom() {
      socket.emit('chat:leave', {
        chatRoomId: chatRoomId,
        userId: userId
      });
    }

    // 페이지 종료 시 연결 해제
    window.addEventListener('beforeunload', () => {
      leaveChatRoom();
      socket.disconnect();
    });
  </script>
</body>
</html>
```

### React 예시

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function ChatRoom({ chatRoomId, userId }: { chatRoomId: string; userId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    // Socket.io 연결
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✓ 서버에 연결되었습니다:', newSocket.id);
      
      // 채팅방 입장
      newSocket.emit('chat:join', {
        chatRoomId,
        userId
      });
    });

    // 메시지 수신
    newSocket.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // 사용자 입장/퇴장 알림
    newSocket.on('chat:joined', (data) => {
      console.log('사용자 입장:', data);
    });

    newSocket.on('chat:left', (data) => {
      console.log('사용자 퇴장:', data);
    });

    // 에러 처리
    newSocket.on('error', (error) => {
      console.error('에러:', error);
    });

    setSocket(newSocket);

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      newSocket.emit('chat:leave', { chatRoomId, userId });
      newSocket.disconnect();
    };
  }, [chatRoomId, userId]);

  const sendMessage = () => {
    if (!socket || !messageInput.trim()) return;

    socket.emit('chat:send', {
      chatRoomId,
      senderId: userId,
      content: messageInput,
      messageType: 'text'
    });

    setMessageInput('');
  };

  const markAsRead = (messageId: string) => {
    if (!socket) return;
    
    socket.emit('chat:read', {
      messageId,
      userId
    });
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} onClick={() => markAsRead(msg.id)}>
            <strong>{msg.sender?.nickname}</strong>: {msg.content}
          </div>
        ))}
      </div>
      <input
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>전송</button>
    </div>
  );
}

export default ChatRoom;
```

---

## 이벤트 목록

### 클라이언트 → 서버 (emit)

#### 1. `chat:join`
채팅방 입장

```typescript
socket.emit('chat:join', {
  chatRoomId: string;  // 채팅방 UUID
  userId: string;      // 사용자 UUID
});
```

#### 2. `chat:send`
메시지 전송

```typescript
socket.emit('chat:send', {
  chatRoomId: string;                    // 채팅방 UUID
  senderId: string;                      // 발신자 UUID
  content: string;                       // 메시지 내용
  messageType?: 'text' | 'image' | 'file'; // 메시지 타입 (기본값: 'text')
});
```

#### 3. `chat:read`
메시지 읽음 처리

```typescript
socket.emit('chat:read', {
  messageId: string;  // 메시지 UUID
  userId: string;     // 사용자 UUID
});
```

#### 4. `chat:leave`
채팅방 나가기

```typescript
socket.emit('chat:leave', {
  chatRoomId: string;  // 채팅방 UUID
  userId: string;      // 사용자 UUID
});
```

#### 5. `notification:subscribe`
사용자 알림 룸 구독

```typescript
socket.emit('notification:subscribe', {
  userId: string; // 사용자 UUID
});
```

### 서버 → 클라이언트 (on)

#### 1. `chat:message`
메시지 수신

```typescript
socket.on('chat:message', (message: {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  sender: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    studentId: string;
  };
  createdAt: string;
  updatedAt: string;
}) => {
  // 메시지 처리
});
```

#### 2. `chat:joined`
사용자 입장 알림

```typescript
socket.on('chat:joined', (data: {
  userId: string;
  chatRoomId: string;
  message: string;
}) => {
  // 입장 알림 처리
});
```

#### 3. `chat:left`
사용자 퇴장 알림

```typescript
socket.on('chat:left', (data: {
  userId: string;
  chatRoomId: string;
  message: string;
}) => {
  // 퇴장 알림 처리
});
```

#### 4. `chat:read`
메시지 읽음 처리 알림

```typescript
socket.on('chat:read', (data: {
  messageId: string;
  userId: string;
}) => {
  // 읽음 처리 알림
});
```

#### 5. `notification:new`
새 알림 수신

```typescript
socket.on('notification:new', (notification: {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  postId: string | null;
  chatRoomId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}) => {
  // 알림 배지 갱신 또는 토스트 표시
});
```

#### 6. `socket:error`
에러 발생

```typescript
socket.on('socket:error', (error: {
  message: string;
  error?: string;
}) => {
  // 에러 처리
});
```

#### 7. `connect`
연결 성공

```typescript
socket.on('connect', () => {
  console.log('연결됨:', socket.id);
});
```

#### 8. `disconnect`
연결 해제

```typescript
socket.on('disconnect', (reason) => {
  console.log('연결 해제:', reason);
});
```

---

## 사용 예시

### 전체 흐름

```javascript
// 1. Socket.io 연결
const socket = io('http://localhost:3000');

// 2. 연결 성공 시 채팅방 입장
socket.on('connect', () => {
  socket.emit('chat:join', {
    chatRoomId: 'chat-room-uuid',
    userId: 'user-uuid'
  });
});

// 3. 메시지 수신 대기
socket.on('chat:message', (message) => {
  console.log('새 메시지:', message);
  // UI에 메시지 표시
});

// 4. 메시지 전송
socket.emit('chat:send', {
  chatRoomId: 'chat-room-uuid',
  senderId: 'user-uuid',
  content: '안녕하세요!',
  messageType: 'text'
});

// 5. 채팅방 나가기
socket.emit('chat:leave', {
  chatRoomId: 'chat-room-uuid',
  userId: 'user-uuid'
});

// 6. 연결 해제
socket.disconnect();
```

---

## 주의사항

### 1. CORS 설정
프로덕션 환경에서는 Socket.io의 CORS 설정을 특정 도메인으로 제한해야 합니다:

```typescript
// src/config/socket.ts
const io = new SocketServer(httpServer, {
  cors: {
    origin: "https://your-frontend-domain.com", // 특정 도메인만 허용
    methods: ["GET", "POST"],
    credentials: true,
  },
});
```

### 2. 인증/인가
현재는 `userId`를 클라이언트에서 직접 전송하고 있습니다. 실제 프로덕션에서는:

- JWT 토큰을 사용한 인증
- Socket.io 미들웨어에서 토큰 검증
- 권한 확인 (채팅방 접근 권한 등)

```typescript
// 예시: Socket.io 미들웨어 추가
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // JWT 검증 로직
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('인증 실패'));
  }
});
```

### 3. 메시지 히스토리
Socket.io는 실시간 메시지만 전송합니다. 과거 메시지는 REST API로 조회해야 합니다:

```javascript
// 채팅방 입장 시 과거 메시지 로드
async function loadMessageHistory(chatRoomId) {
  const response = await fetch(
    `http://localhost:3000/api/chat/rooms/${chatRoomId}/messages?limit=50`
  );
  const messages = await response.json();
  // UI에 표시
}
```

### 4. 재연결 처리
Socket.io는 자동으로 재연결을 시도합니다. 재연결 시 채팅방에 다시 입장해야 합니다:

```javascript
socket.on('reconnect', () => {
  // 재연결 시 채팅방 다시 입장
  socket.emit('chat:join', {
    chatRoomId: chatRoomId,
    userId: userId
  });
});
```

### 5. 성능 최적화
- 대량의 메시지가 있는 경우 페이징 처리
- 이미지/파일은 별도 업로드 후 URL만 전송
- 메시지 브로드캐스트 최적화

---

## REST API와의 통합

Socket.io는 실시간 통신을 담당하고, REST API는 다음과 같은 용도로 사용합니다:

- **REST API**: 채팅방 생성, 메시지 히스토리 조회, 사용자 정보 조회
- **Socket.io**: 실시간 메시지 전송/수신, 입장/퇴장 알림

### 예시: 채팅방 생성 후 실시간 채팅 시작

```javascript
// 1. REST API로 채팅방 생성
const createChatRoom = async (postId) => {
  const response = await fetch('http://localhost:3000/api/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatRoom: { postId }
    })
  });
  const chatRoom = await response.json();
  return chatRoom;
};

// 2. 채팅방 생성 후 Socket.io로 연결
const postId = 'post-uuid';
const chatRoom = await createChatRoom(postId);

// 3. Socket.io로 채팅방 입장
socket.emit('chat:join', {
  chatRoomId: chatRoom.id,
  userId: 'user-uuid'
});
```

---

## 문제 해결

### 연결이 안 될 때
1. 서버가 실행 중인지 확인
2. 포트 번호 확인 (기본값: 3000)
3. CORS 설정 확인
4. 브라우저 콘솔에서 에러 확인

### 메시지가 전송되지 않을 때
1. 채팅방에 입장했는지 확인 (`chat:join` 이벤트)
2. `chatRoomId`와 `senderId`가 올바른지 확인
3. 서버 로그 확인

### 메시지가 중복으로 표시될 때
1. 이벤트 리스너가 중복 등록되지 않았는지 확인
2. 컴포넌트 언마운트 시 이벤트 리스너 제거

---

## 참고 자료

- [Socket.io 공식 문서](https://socket.io/docs/v4/)
- [Socket.io 클라이언트 API](https://socket.io/docs/v4/client-api/)
- [Socket.io 서버 API](https://socket.io/docs/v4/server-api/)
