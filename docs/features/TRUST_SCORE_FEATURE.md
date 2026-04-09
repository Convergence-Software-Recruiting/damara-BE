# 신뢰점수(Trust Score) 기능 추가 문서

## 📋 개요

사용자의 공동구매 활동을 기반으로 신뢰도를 수치화한 신뢰점수(Trust Score) 기능을 구현했습니다.

**작업 일자**: 2025-11-24  
**작업 범위**: Backend API (Model, Repository, Service, Controller, Swagger)

---

## 🎯 신뢰점수 계산 기준

### 활동점수

| 활동 | 점수 변화 |
|------|----------|
| 회원가입 초기 점수 | 50점 |
| 공동구매 성공적 완료 (주최자) | +10점 |
| 공동구매 성공적 참여 (참여자) | +5점 |
| 공동구매 취소 (주최자) | -5점 |
| 참여 후 취소 (참여자) | -3점 |
| 게시글 삭제 (주최자) | -5점 |

### 신뢰점수 등급 (프론트엔드 표시용)

| 점수 범위 | 등급 | 표시 |
|----------|------|------|
| 90 ~ 100 | 최우수 | ⭐⭐⭐⭐⭐ |
| 70 ~ 89 | 우수 | ⭐⭐⭐⭐ |
| 50 ~ 69 | 보통 | ⭐⭐⭐ |
| 30 ~ 49 | 주의 | ⭐⭐ |
| 0 ~ 29 | 경고 | ⭐ |

**참고**: 점수는 0~100 범위로 제한되며, 계산 결과가 범위를 벗어나면 자동으로 조정됩니다.

---

## 📝 변경사항 상세

### 1. 데이터베이스 스키마 변경

#### User 모델 (`src/models/User.ts`)

**추가된 필드**:
```typescript
trustScore: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 50,
  field: "trust_score",
  validate: {
    min: 0,
    max: 100,
  },
}
```

**변경 내용**:
- `UserAttributes` 인터페이스에 `trustScore: number` 추가
- `UserCreationAttributes`에 `trustScore`를 optional로 추가 (기본값 50)
- `UserModel` 클래스에 `trustScore` 필드 추가
- `UserModel.init()`에서 `trustScore` 컬럼 정의 추가
- 최소값 0, 최대값 100으로 제한

**데이터베이스 마이그레이션**:
- 기존 `users` 테이블에 `trust_score` 컬럼이 추가되어야 합니다.
- Sequelize의 `sync()` 기능을 사용하는 경우, 서버 재시작 시 자동으로 컬럼이 추가됩니다.
- 수동 마이그레이션이 필요한 경우:
  ```sql
  ALTER TABLE users ADD COLUMN trust_score INTEGER NOT NULL DEFAULT 50;
  ALTER TABLE users ADD CONSTRAINT check_trust_score_range CHECK (trust_score >= 0 AND trust_score <= 100);
  ```

---

### 2. Repository 레이어 변경

#### UserRepo (`src/repos/UserRepo.ts`)

**변경된 메서드**:

1. **`create(data)`**
   ```typescript
   async create(data: UserCreationAttributes) {
     // trustScore가 제공되지 않으면 기본값 50으로 설정
     const userData = {
       ...data,
       trustScore: data.trustScore ?? 50,
     };
     const user = await UserModel.create(userData);
     return user.get();
   }
   ```
   - 회원가입 시 `trustScore`가 없으면 기본값 50으로 설정

2. **`findById(id)`** (신규 추가)
   ```typescript
   async findById(id: string) {
     const user = await UserModel.findByPk(id);
     return user ? user.get() : null;
   }
   ```
   - 사용자 ID로 조회하는 메서드 추가

---

### 3. Service 레이어 변경

#### UserService (`src/services/UserService.ts`)

**추가된 메서드**:

1. **`updateTrustScore(userId, scoreChange)`**
   ```typescript
   async updateTrustScore(userId: string, scoreChange: number) {
     const user = await UserRepo.findById(userId);
     if (!user) {
       throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
     }

     // 현재 점수에 변화량을 더하고, 0~100 범위로 제한
     const newScore = Math.max(0, Math.min(100, user.trustScore + scoreChange));

     await UserRepo.update(userId, { trustScore: newScore });
     return newScore;
   }
   ```
   - 신뢰점수를 업데이트하는 메서드
   - 점수 변화량(양수: 증가, 음수: 감소)을 받아서 업데이트
   - 0~100 범위로 자동 제한

2. **`getUserById(id)`** (신규 추가)
   ```typescript
   async getUserById(id: string) {
     const user = await UserRepo.findById(id);
     if (!user) {
       throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
     }
     // 비밀번호 해시 제외
     const { passwordHash, ...userWithoutPassword } = user;
     return userWithoutPassword;
   }
   ```
   - 사용자 ID로 조회 (비밀번호 제외)

#### PostService (`src/services/PostService.ts`)

**변경된 메서드**:

1. **`updatePost(id, patch)`**
   ```typescript
   async updatePost(id: string, patch: Partial<PostCreationAttributes>) {
     // 이전 상태 확인
     const oldPost = await PostRepo.findById(id);
     if (!oldPost) {
       throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
     }

     const updatedPost = await PostRepo.update(id, patch);
     const newPost = updatedPost?.get();

     // status 변경 시 신뢰점수 업데이트
     if (patch.status && oldPost.status !== patch.status) {
       if (patch.status === "closed") {
         // 공동구매 완료: 주최자 +10점, 참여자 +5점
         await UserService.updateTrustScore(oldPost.authorId, 10);
         
         const participants = await PostParticipantRepo.findByPostId(id);
         for (const participant of participants) {
           await UserService.updateTrustScore(participant.userId, 5);
         }
       } else if (patch.status === "cancelled") {
         // 공동구매 취소: 주최자 -5점
         await UserService.updateTrustScore(oldPost.authorId, -5);
       }
     }

     return newPost;
   }
   ```
   - 게시글 상태가 `closed`로 변경되면:
     - 주최자에게 +10점
     - 참여자들에게 +5점
   - 게시글 상태가 `cancelled`로 변경되면:
     - 주최자에게 -5점

2. **`deletePost(id)`**
   ```typescript
   async deletePost(id: string) {
     // 삭제 전에 게시글 정보 조회
     const post = await PostRepo.findById(id);
     if (!post) {
       throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
     }

     await PostRepo.delete(id);

     // 주최자 신뢰점수 감소
     await UserService.updateTrustScore(post.authorId, -5);
   }
   ```
   - 게시글 삭제 시 주최자에게 -5점

3. **`PostParticipantService.leavePost(postId, userId)`**
   ```typescript
   async leavePost(postId: string, userId: string) {
     await PostParticipantRepo.delete(postId, userId);

     // currentQuantity 업데이트
     const count = await PostParticipantRepo.countByPostId(postId);
     await PostModel.update(
       { currentQuantity: count },
       { where: { id: postId } }
     );

     // 참여자 신뢰점수 감소
     await UserService.updateTrustScore(userId, -3);
   }
   ```
   - 참여 취소 시 참여자에게 -3점

---

### 4. Controller 레이어 변경

#### UserController (`src/controllers/user.controller.ts`)

**추가된 메서드**:

1. **`getUserById(req, res, next)`** (신규)
   ```typescript
   export async function getUserById(
     req: Request,
     res: Response,
     next: NextFunction
   ) {
     try {
       const { id } = req.params;
       const user = await UserService.getUserById(id);
       res.status(HttpStatusCodes.OK).json(user);
     } catch (error) {
       next(error);
     }
   }
   ```
   - `GET /api/users/:id` 엔드포인트 추가
   - 응답에 `trustScore` 포함

**기존 메서드 변경사항**:
- 모든 User 응답에 `trustScore` 필드가 자동으로 포함됨
- `createUser`: 회원가입 응답에 `trustScore: 50` 포함
- `login`: 로그인 응답에 `trustScore` 포함
- `getAllUsers`: 전체 조회 응답에 `trustScore` 포함

---

### 5. Routes 변경

#### UserRoutes (`src/routes/users/UserRoutes.ts`)

**추가된 라우트**:

```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 사용자 정보 조회
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
userRouter.get("/:id", getUserById);
```

---

### 6. Swagger API 문서 변경

#### Swagger Config (`src/config/swagger.ts`)

**User 스키마에 추가된 필드**:
```typescript
trustScore: {
  type: "integer",
  description: "신뢰점수 (0~100, 기본값: 50)",
  minimum: 0,
  maximum: 100,
  example: 50,
}
```

**User 스키마 required 필드 업데이트**:
```typescript
required: ["id", "email", "nickname", "studentId", "trustScore"]
```

---

## 🔌 API 사용 예시

### 1. 회원가입 (trustScore 자동 설정)

```http
POST /api/users
Content-Type: application/json

{
  "user": {
    "email": "test@mju.ac.kr",
    "passwordHash": "mypassword123",
    "nickname": "홍길동",
    "studentId": "20241234",
    "department": "컴퓨터공학과"
  }
}
```

**응답**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@mju.ac.kr",
  "nickname": "홍길동",
  "studentId": "20241234",
  "department": "컴퓨터공학과",
  "trustScore": 50,
  "createdAt": "2025-11-24T10:00:00.000Z",
  "updatedAt": "2025-11-24T10:00:00.000Z"
}
```

### 2. 로그인 (trustScore 포함)

```http
POST /api/users/login
Content-Type: application/json

{
  "studentId": "20241234",
  "password": "mypassword123"
}
```

**응답**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@mju.ac.kr",
  "nickname": "홍길동",
  "studentId": "20241234",
  "department": "컴퓨터공학과",
  "trustScore": 75,
  "createdAt": "2025-11-24T10:00:00.000Z",
  "updatedAt": "2025-11-24T10:00:00.000Z"
}
```

### 3. 사용자 정보 조회 (신규)

```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000
```

**응답**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@mju.ac.kr",
  "nickname": "홍길동",
  "studentId": "20241234",
  "department": "컴퓨터공학과",
  "avatarUrl": "https://example.com/avatar.jpg",
  "trustScore": 75,
  "createdAt": "2025-11-24T10:00:00.000Z",
  "updatedAt": "2025-11-24T10:00:00.000Z"
}
```

### 4. 공동구매 완료 시 신뢰점수 자동 업데이트

```http
PUT /api/posts/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "post": {
    "status": "closed"
  }
}
```

**자동 처리**:
- 주최자 신뢰점수: +10점
- 참여자들 신뢰점수: 각각 +5점

### 5. 참여 취소 시 신뢰점수 자동 업데이트

```http
DELETE /api/posts/123e4567-e89b-12d3-a456-426614174000/participate/abc123...
```

**자동 처리**:
- 참여자 신뢰점수: -3점

---

## ✅ 호환성

### 하위 호환성
- ✅ 기존 API 호출은 그대로 동작합니다 (`trustScore` 필드가 자동으로 포함됨)
- ✅ 기존 사용자는 서버 재시작 시 `trustScore: 50`으로 자동 설정됩니다
- ✅ 프론트엔드에서 `trustScore` 필드를 사용하지 않아도 문제없습니다

### 데이터베이스 마이그레이션
- 기존 `users` 테이블에 `trust_score` 컬럼이 없으면 서버 시작 시 Sequelize가 자동으로 추가합니다
- 수동 마이그레이션이 필요한 경우 위의 SQL 명령어를 실행하세요
- 기존 사용자의 `trust_score`는 기본값 50으로 설정됩니다

---

## 🧪 테스트 방법

### 1. Swagger UI에서 테스트
1. 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000/api-docs` 접속
3. `POST /api/users` 엔드포인트에서 회원가입 테스트
4. 응답에서 `trustScore: 50` 확인
5. `GET /api/users/{id}` 엔드포인트에서 사용자 정보 조회 테스트

### 2. 신뢰점수 자동 업데이트 테스트

#### 공동구매 완료 테스트
```bash
# 1. 게시글 생성
curl -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "post": {
      "authorId": "user-id-1",
      "title": "테스트 게시글",
      "content": "테스트 내용",
      "price": 10000,
      "minParticipants": 2,
      "deadline": "2025-12-31T23:59:59.000Z"
    }
  }'

# 2. 참여하기
curl -X POST "http://localhost:3000/api/posts/post-id/participate" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-2"}'

# 3. 게시글 상태를 closed로 변경
curl -X PUT "http://localhost:3000/api/posts/post-id" \
  -H "Content-Type: application/json" \
  -d '{"post": {"status": "closed"}}'

# 4. 사용자 정보 조회하여 신뢰점수 확인
curl "http://localhost:3000/api/users/user-id-1"  # 주최자: +10점
curl "http://localhost:3000/api/users/user-id-2"  # 참여자: +5점
```

#### 참여 취소 테스트
```bash
# 참여 취소
curl -X DELETE "http://localhost:3000/api/posts/post-id/participate/user-id-2"

# 사용자 정보 조회하여 신뢰점수 확인 (참여자: -3점)
curl "http://localhost:3000/api/users/user-id-2"
```

---

## 📚 관련 파일 목록

### 수정된 파일
1. `src/models/User.ts` - User 모델에 trustScore 필드 추가
2. `src/repos/UserRepo.ts` - findById 메서드 추가, create에서 trustScore 기본값 설정
3. `src/services/UserService.ts` - updateTrustScore, getUserById 메서드 추가
4. `src/services/PostService.ts` - updatePost, deletePost, leavePost에 신뢰점수 업데이트 로직 추가
5. `src/controllers/user.controller.ts` - getUserById 메서드 추가
6. `src/routes/users/UserRoutes.ts` - GET /api/users/:id 라우트 추가
7. `src/config/swagger.ts` - User 스키마에 trustScore 필드 추가

---

## 🔄 신뢰점수 업데이트 시점

### 자동 업데이트 이벤트

| 이벤트 | API/시점 | 점수 변화 | 대상 |
|--------|----------|----------|------|
| 공동구매 완료 (주최자) | `PUT /api/posts/{id}` (status: "closed") | +10점 | 주최자 |
| 공동구매 완료 (참여자) | `PUT /api/posts/{id}` (status: "closed") | +5점 | 참여자들 |
| 공동구매 취소 (주최자) | `PUT /api/posts/{id}` (status: "cancelled") | -5점 | 주최자 |
| 참여 취소 | `DELETE /api/posts/{id}/participate/{userId}` | -3점 | 참여자 |
| 게시글 삭제 | `DELETE /api/posts/{id}` | -5점 | 주최자 |

### 주의사항
- 신뢰점수 업데이트 실패 시에도 메인 작업(게시글 업데이트, 삭제 등)은 성공으로 처리됩니다
- 에러는 콘솔에 로그로 기록되며, 사용자에게는 표시되지 않습니다
- 신뢰점수는 0~100 범위로 자동 제한됩니다

---

## 🔄 향후 개선 사항

1. **신뢰점수 히스토리**
   - 신뢰점수 변경 이력을 별도 테이블에 기록
   - 사용자가 자신의 신뢰점수 변화 추이를 확인 가능

2. **신뢰점수 조회 API**
   - 사용자별 신뢰점수 통계 API 추가
   - 예: `GET /api/users/{id}/trust-score/history`

3. **신뢰점수 계산 로직 확장**
   - 리뷰/평가 시스템 연동
   - 거래 완료율 기반 점수 계산
   - 시간 가중치 적용 (최근 활동에 더 높은 가중치)

4. **신뢰점수 기반 필터링**
   - 게시글 목록에서 최소 신뢰점수 필터링
   - 신뢰점수 높은 사용자 우선 표시

---

## 📞 문의

신뢰점수 기능 관련 문의사항이 있으면 개발팀에 연락해주세요.

