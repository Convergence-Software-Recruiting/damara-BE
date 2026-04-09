# 프로필 이미지 업로드 기능 문서

## 📋 개요

사용자가 프로필 이미지를 업로드하고 변경할 수 있는 기능입니다. 이미지 업로드 API와 사용자 정보 수정 API를 연동하여 프로필 이미지를 관리합니다.

**작업 일자**: 2025-11-24  
**작업 범위**: Swagger API 문서 업데이트 및 확인

---

## ✅ 현재 구현 상태

### 1. 이미지 업로드 API (기존 구현)

**엔드포인트**: `POST /api/upload/image`

**Request**:
- Content-Type: `multipart/form-data`
- Body: `image` (이미지 파일)

**Response**:
```json
{
  "url": "/uploads/images/abc123.png",
  "filename": "abc123.png"
}
```

**구현 위치**:
- `src/routes/upload/UploadRoutes.ts`
- `src/controllers/upload.controller.ts`

---

### 2. User 스키마에 avatarUrl 필드 (기존 구현)

**필드 정보**:
- 필드명: `avatarUrl` (데이터베이스: `avatar_url`)
- 타입: `string | null`
- 필수 여부: 선택 (nullable)
- 최대 길이: 500자

**구현 위치**:
- `src/models/User.ts`: UserAttributes 인터페이스에 `avatarUrl: string | null` 포함
- `src/models/User.ts`: UserModel.init()에서 컬럼 정의

---

### 3. 사용자 정보 수정 API (기존 구현)

**엔드포인트**: `PUT /api/users/{id}`

**Request Body**:
```json
{
  "user": {
    "nickname": "수정된닉네임",
    "department": "수정된학과",
    "avatarUrl": "http://3.38.145.117:3000/uploads/images/abc123.png"
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "email": "test@mju.ac.kr",
  "nickname": "수정된닉네임",
  "studentId": "20241234",
  "department": "수정된학과",
  "avatarUrl": "http://3.38.145.117:3000/uploads/images/abc123.png",
  "trustScore": 50,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**구현 위치**:
- `src/routes/common/validation/user-schemas.ts`: `updateUserSchema`에 `avatarUrl` 필드 포함 (optional)
- `src/controllers/user.controller.ts`: `updateUser` 함수
- `src/services/UserService.ts`: `updateUser` 메서드

---

### 4. 로그인/회원가입 응답에 avatarUrl 포함 (기존 구현)

**회원가입 API**: `POST /api/users`

**Response**:
```json
{
  "id": "uuid",
  "email": "test@mju.ac.kr",
  "nickname": "홍길동",
  "studentId": "20241234",
  "department": "컴퓨터공학과",
  "avatarUrl": "http://3.38.145.117:3000/uploads/images/abc123.png",
  "trustScore": 50,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**로그인 API**: `POST /api/users/login`

**Response**:
```json
{
  "id": "uuid",
  "email": "test@mju.ac.kr",
  "nickname": "홍길동",
  "studentId": "20241234",
  "department": "컴퓨터공학과",
  "avatarUrl": "http://3.38.145.117:3000/uploads/images/abc123.png",
  "trustScore": 75,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**구현 위치**:
- `src/services/UserService.ts`: 
  - `registerUser`: 생성된 사용자 객체 그대로 반환 (avatarUrl 포함)
  - `loginByStudentId`: 사용자 객체에서 passwordHash만 제외하고 반환 (avatarUrl 포함)

---

## 📝 변경사항 상세

### Swagger API 문서 업데이트

#### 1. UserRoutes.ts - 사용자 정보 수정 API 예시 업데이트

**변경 전**:
```typescript
 *           example:
 *             user:
 *               nickname: "수정된닉네임"
 *               department: "수정된학과"
```

**변경 후**:
```typescript
 *           example:
 *             user:
 *               nickname: "수정된닉네임"
 *               department: "수정된학과"
 *               avatarUrl: "http://3.38.145.117:3000/uploads/images/abc123.png"
```

**파일**: `src/routes/users/UserRoutes.ts`

**변경 내용**:
- `PUT /api/users/{id}` API 문서의 예시에 `avatarUrl` 필드 추가
- 실제 서버 URL 형식의 예시로 업데이트

---

#### 2. UserRoutes.ts - 회원가입 API 예시 업데이트

**변경 전**:
```typescript
 *               avatarUrl: "https://example.com/avatar.jpg"
```

**변경 후**:
```typescript
 *               avatarUrl: "http://3.38.145.117:3000/uploads/images/abc123.png"
```

**파일**: `src/routes/users/UserRoutes.ts`

**변경 내용**:
- `POST /api/users` API 문서의 예시를 실제 서버 URL 형식으로 업데이트

---

#### 3. UploadRoutes.ts - 이미지 업로드 API 응답 스키마 업데이트

**변경 전**:
```typescript
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   description: 업로드된 이미지 URL
```

**변경 후**:
```typescript
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 업로드된 이미지 URL
 *                   example: "/uploads/images/abc123.png"
 *                 filename:
 *                   type: string
 *                   description: 업로드된 파일명
 *                   example: "abc123.png"
```

**파일**: `src/routes/upload/UploadRoutes.ts`

**변경 내용**:
- 응답 스키마를 실제 응답 형식에 맞게 수정
- `imageUrl` → `url`로 필드명 변경
- `filename` 필드 추가
- 예시 값 추가

---

## 🔌 API 사용 예시

### 1. 프로필 이미지 업로드

```http
POST /api/upload/image
Content-Type: multipart/form-data

image: [파일]
```

**응답**:
```json
{
  "url": "/uploads/images/abc123.png",
  "filename": "abc123.png"
}
```

**cURL 예시**:
```bash
curl -X POST "http://3.38.145.117:3000/api/upload/image" \
  -F "image=@/path/to/image.jpg"
```

---

### 2. 사용자 정보 수정 (프로필 이미지 포함)

```http
PUT /api/users/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "user": {
    "nickname": "수정된닉네임",
    "department": "수정된학과",
    "avatarUrl": "http://3.38.145.117:3000/uploads/images/abc123.png"
  }
}
```

**응답**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@mju.ac.kr",
  "nickname": "수정된닉네임",
  "studentId": "20241234",
  "department": "수정된학과",
  "avatarUrl": "http://3.38.145.117:3000/uploads/images/abc123.png",
  "trustScore": 50,
  "createdAt": "2025-11-24T10:00:00.000Z",
  "updatedAt": "2025-11-24T12:00:00.000Z"
}
```

**cURL 예시**:
```bash
curl -X PUT "http://3.38.145.117:3000/api/users/123e4567-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "nickname": "수정된닉네임",
      "avatarUrl": "http://3.38.145.117:3000/uploads/images/abc123.png"
    }
  }'
```

---

### 3. 전체 워크플로우 예시

#### Step 1: 이미지 업로드
```bash
# 이미지 업로드
curl -X POST "http://3.38.145.117:3000/api/upload/image" \
  -F "image=@profile.jpg"

# 응답
# {
#   "url": "/uploads/images/abc123.png",
#   "filename": "abc123.png"
# }
```

#### Step 2: 전체 URL 생성
프론트엔드에서 서버 URL과 결합:
```javascript
const imageUrl = `http://3.38.145.117:3000${response.url}`;
// 결과: "http://3.38.145.117:3000/uploads/images/abc123.png"
```

#### Step 3: 사용자 정보 수정
```bash
curl -X PUT "http://3.38.145.117:3000/api/users/{userId}" \
  -H "Content-Type: application/json" \
  -d "{
    \"user\": {
      \"avatarUrl\": \"http://3.38.145.117:3000/uploads/images/abc123.png\"
    }
  }"
```

---

## ✅ 확인 완료 사항

### 1. User 스키마에 avatarUrl 필드 존재 ✅
- `src/models/User.ts`: `avatarUrl: string | null` 필드 존재
- 데이터베이스 컬럼: `avatar_url VARCHAR(500) NULL`
- Validation 스키마: `createUserSchema`, `updateUserSchema`에 포함

### 2. PUT /api/users/{id}에서 avatarUrl 수정 지원 ✅
- `updateUserSchema`에 `avatarUrl` 필드 포함 (optional)
- `UserService.updateUser`가 `avatarUrl` 자동 처리
- Swagger 문서 예시 업데이트 완료

### 3. 로그인/회원가입 응답에 avatarUrl 포함 ✅
- `UserService.registerUser`: 생성된 사용자 객체 그대로 반환 (avatarUrl 포함)
- `UserService.loginByStudentId`: 사용자 객체에서 passwordHash만 제외하고 반환 (avatarUrl 포함)
- Swagger 문서에 User 스키마에 `avatarUrl` 필드 포함

### 4. 이미지 업로드 API 응답 형식 확인 ✅
- `POST /api/upload/image`: `{ "url": "...", "filename": "..." }` 형식으로 응답
- Swagger 문서 업데이트 완료

---

## 📚 관련 파일 목록

### 수정된 파일
1. `src/routes/users/UserRoutes.ts` - Swagger 문서 예시 업데이트
2. `src/routes/upload/UploadRoutes.ts` - Swagger 문서 응답 스키마 업데이트

### 기존 구현 파일 (변경 없음)
1. `src/models/User.ts` - User 모델에 avatarUrl 필드 정의
2. `src/routes/common/validation/user-schemas.ts` - Validation 스키마
3. `src/controllers/user.controller.ts` - User Controller
4. `src/services/UserService.ts` - User Service
5. `src/controllers/upload.controller.ts` - Upload Controller
6. `src/config/swagger.ts` - User 스키마 정의

---

## 🔄 프론트엔드 연동 가이드

### 1. 프로필 이미지 업로드 및 설정

```javascript
// 1. 이미지 파일 선택
const fileInput = document.getElementById('avatar-input');
const file = fileInput.files[0];

// 2. FormData 생성
const formData = new FormData();
formData.append('image', file);

// 3. 이미지 업로드
const uploadResponse = await fetch('http://3.38.145.117:3000/api/upload/image', {
  method: 'POST',
  body: formData
});

const { url, filename } = await uploadResponse.json();

// 4. 전체 URL 생성
const fullImageUrl = `http://3.38.145.117:3000${url}`;

// 5. 사용자 정보 업데이트
const updateResponse = await fetch(`http://3.38.145.117:3000/api/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user: {
      avatarUrl: fullImageUrl
    }
  })
});

const updatedUser = await updateResponse.json();
console.log('프로필 이미지 업데이트 완료:', updatedUser.avatarUrl);
```

---

## 🧪 테스트 방법

### 1. Swagger UI에서 테스트

1. 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000/api-docs` 접속
3. `POST /api/upload/image` 엔드포인트에서 "Try it out" 클릭
4. 이미지 파일 선택 후 "Execute" 클릭
5. 응답에서 `url`과 `filename` 확인
6. `PUT /api/users/{id}` 엔드포인트에서 `avatarUrl` 필드로 업데이트 테스트

### 2. cURL로 테스트

```bash
# 1. 이미지 업로드
curl -X POST "http://localhost:3000/api/upload/image" \
  -F "image=@/path/to/image.jpg"

# 응답 예시:
# {"url":"/uploads/images/abc123.png","filename":"abc123.png"}

# 2. 사용자 정보 수정 (avatarUrl 포함)
curl -X PUT "http://localhost:3000/api/users/your-user-id" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "avatarUrl": "http://localhost:3000/uploads/images/abc123.png"
    }
  }'

# 3. 로그인하여 avatarUrl 확인
curl -X POST "http://localhost:3000/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "20241234",
    "password": "yourpassword"
  }'
```

---

## 📝 주의사항

### 1. 이미지 URL 형식
- 업로드 API는 상대 경로(`/uploads/images/...`)를 반환합니다.
- 프론트엔드에서 전체 URL을 생성할 때 서버 URL과 결합해야 합니다.
- 예: `http://3.38.145.117:3000` + `/uploads/images/abc123.png`

### 2. 파일 크기 제한
- 현재 이미지 업로드 제한: 최대 5MB
- 설정 위치: `src/config/multer.ts`

### 3. 파일 저장 위치
- 업로드된 파일은 `src/public/uploads/images/` 디렉토리에 저장됩니다.
- 정적 파일 서빙은 Express의 `express.static` 미들웨어로 처리됩니다.

### 4. avatarUrl 업데이트
- `PUT /api/users/{id}`에서 `avatarUrl`만 업데이트할 수도 있고, 다른 필드와 함께 업데이트할 수도 있습니다.
- `avatarUrl`을 `null`로 설정하면 프로필 이미지를 제거할 수 있습니다.

---

## 🔄 향후 개선 사항

1. **이미지 리사이징**
   - 업로드 시 자동으로 썸네일 생성
   - 다양한 크기의 이미지 제공

2. **이미지 삭제**
   - 사용자 정보 수정 시 기존 이미지 파일 자동 삭제
   - 미사용 이미지 정리 기능

3. **이미지 검증 강화**
   - 파일 형식 검증 (jpg, png, gif만 허용)
   - 이미지 크기 검증 (최소/최대 해상도)

4. **CDN 연동**
   - 이미지를 CDN에 업로드하여 성능 향상
   - 예: AWS S3, Cloudinary 등

---

## 📞 문의

프로필 이미지 업로드 기능 관련 문의사항이 있으면 개발팀에 연락해주세요.

