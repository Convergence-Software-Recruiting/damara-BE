# 카테고리 기능 추가 문서

## 📋 개요

게시글(Post)에 카테고리(category) 필드를 추가하여 카테고리별 공동구매 필터링 기능을 구현했습니다.

**작업 일자**: 2025-11-24  
**작업 범위**: Backend API (Model, Repository, Service, Controller, Swagger)

---

## 🎯 카테고리 목록

| 카테고리 ID   | 카테고리명 |
| ------------- | ---------- |
| `food`        | 먹거리     |
| `daily`       | 일상용품   |
| `beauty`      | 뷰티·패션  |
| `electronics` | 전자기기   |
| `school`      | 학용품     |
| `freemarket`  | 프리마켓   |

---

## 📝 변경사항 상세

### 1. 데이터베이스 스키마 변경

#### Post 모델 (`src/models/Post.ts`)

**추가된 필드**:

```typescript
category: {
  type: DataTypes.STRING(50),
  allowNull: true,
  defaultValue: null,
}
```

**변경 내용**:

- `PostAttributes` 인터페이스에 `category: string | null` 추가
- `PostCreationAttributes`에 `category`를 optional로 추가
- `PostModel` 클래스에 `category` 필드 추가
- `PostModel.init()`에서 `category` 컬럼 정의 추가

**데이터베이스 마이그레이션**:

- 기존 `posts` 테이블에 `category` 컬럼이 추가되어야 합니다.
- Sequelize의 `sync()` 기능을 사용하는 경우, 서버 재시작 시 자동으로 컬럼이 추가됩니다.
- 수동 마이그레이션이 필요한 경우:
  ```sql
  ALTER TABLE posts ADD COLUMN category VARCHAR(50) NULL;
  ```

---

### 2. Validation 스키마 변경

#### Post Validation (`src/routes/common/validation/post-schemas.ts`)

**추가된 검증 규칙**:

```typescript
// createPostSchema
category: z.string().min(1).max(50).optional();

// updatePostSchema
category: z.string().min(1).max(50).optional();
```

**변경 내용**:

- `createPostSchema`에 `category` 필드 추가 (optional)
- `updatePostSchema`에 `category` 필드 추가 (optional)
- 최소 길이: 1자, 최대 길이: 50자
- `null` 또는 빈 문자열 허용

---

### 3. Repository 레이어 변경

#### PostRepo (`src/repos/PostRepo.ts`)

**변경된 메서드**:

1. **`list(limit, offset, category?)`**

   ```typescript
   async list(limit = 20, offset = 0, category?: string) {
     const where: any = {};
     if (category) {
       where.category = category;
     }
     // ... 기존 로직
   }
   ```

   - `category` 파라미터 추가 (optional)
   - `category`가 제공되면 WHERE 절에 필터 조건 추가
   - `category`가 없으면 전체 게시글 조회

2. **`update(id, patch)`**
   - 기존 로직 유지
   - `patch` 객체에 `category`가 포함되면 자동으로 업데이트됨

---

### 4. Service 레이어 변경

#### PostService (`src/services/PostService.ts`)

**변경된 메서드**:

1. **`listPosts(limit, offset, category?)`**

   ```typescript
   async listPosts(limit = 20, offset = 0, category?: string) {
     return await PostRepo.list(limit, offset, category);
   }
   ```

   - `category` 파라미터 추가
   - Repository의 `list` 메서드로 전달

2. **`createPost(data, imageUrls)`**

   - 기존 로직 유지
   - `data` 객체에 `category`가 포함되면 자동으로 저장됨

3. **`updatePost(id, patch)`**
   - 기존 로직 유지
   - `patch` 객체에 `category`가 포함되면 자동으로 업데이트됨

---

### 5. Controller 레이어 변경

#### PostController (`src/controllers/post.controller.ts`)

**변경된 메서드**:

1. **`getAllPosts(req, res, next)`**

   ```typescript
   const category = req.query.category as string | undefined;
   const posts = await PostService.listPosts(limit, offset, category);
   ```

   - Query 파라미터에서 `category` 추출
   - Service로 전달

2. **`createPost(req, res, next)`**

   ```typescript
   const { images = [], deadline, category, ...postData } = post;
   const createdPost = await PostService.createPost(
     {
       ...postData,
       deadline: new Date(deadline),
       category: category || null,
     },
     images
   );
   ```

   - Request body에서 `category` 추출
   - `category`가 없으면 `null`로 설정

3. **`updatePost(req, res, next)`**
   ```typescript
   const { deadline, category, ...patchWithoutDeadlineAndCategory } = post;
   const updateData: Partial<PostCreationAttributes> = {
     ...patchWithoutDeadlineAndCategory,
   };
   if (deadline) {
     updateData.deadline = new Date(deadline);
   }
   if (category !== undefined) {
     updateData.category = category || null;
   }
   ```
   - Request body에서 `category` 추출
   - `category`가 `undefined`가 아니면 업데이트 (빈 문자열도 `null`로 변환)

---

### 6. Swagger API 문서 변경

#### Swagger Config (`src/config/swagger.ts`)

**Post 스키마에 추가된 필드**:

```typescript
category: {
  type: "string",
  nullable: true,
  enum: ["food", "daily", "beauty", "electronics", "school", "freemarket"],
  description: "카테고리 ID",
  example: "food",
}
```

#### PostRoutes (`src/routes/posts/PostRoutes.ts`)

**변경된 API 문서**:

1. **GET /api/posts**

   - Query 파라미터에 `category` 추가
   - 예시: `GET /api/posts?category=food&limit=20&offset=0`

2. **POST /api/posts**

   - Request Body에 `category` 필드 추가
   - 예시에 `category: "food"` 포함

3. **PUT /api/posts/{id}**
   - Request Body에 `category` 필드 추가
   - 예시에 `category: "daily"` 포함

---

## 🔌 API 사용 예시

### 1. 게시글 생성 (카테고리 포함)

```http
POST /api/posts
Content-Type: application/json

{
  "post": {
    "authorId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
    "title": "맛있는 치킨 공동구매",
    "content": "BBQ 황금올리브치킨 2마리 세트를 함께 주문하실 분 구합니다!",
    "price": 25000,
    "minParticipants": 2,
    "deadline": "2025-11-27T23:59:59.000Z",
    "pickupLocation": "명지대학교 정문",
    "category": "food",
    "images": ["https://example.com/image.jpg"]
  }
}
```

**응답**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "authorId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
  "title": "맛있는 치킨 공동구매",
  "category": "food",
  ...
}
```

### 2. 카테고리별 게시글 조회

```http
GET /api/posts?category=food&limit=20&offset=0
```

**응답**:

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "맛있는 치킨 공동구매",
    "category": "food",
    "price": 25000,
    ...
  },
  ...
]
```

### 3. 게시글 수정 (카테고리 변경)

```http
PUT /api/posts/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "post": {
    "title": "수정된 제목",
    "category": "daily"
  }
}
```

### 4. 전체 게시글 조회 (카테고리 필터 없음)

```http
GET /api/posts?limit=20&offset=0
```

- `category` 파라미터를 생략하면 모든 카테고리의 게시글이 조회됩니다.

---

## ✅ 호환성

### 하위 호환성

- ✅ 기존 API 호출은 그대로 동작합니다 (`category` 필드가 없어도 정상 작동)
- ✅ 기존 게시글은 `category: null`로 처리됩니다
- ✅ 프론트엔드에서 `category` 필드를 사용하지 않아도 문제없습니다

### 데이터베이스 마이그레이션

- 기존 `posts` 테이블에 `category` 컬럼이 없으면 서버 시작 시 Sequelize가 자동으로 추가합니다
- 수동 마이그레이션이 필요한 경우 위의 SQL 명령어를 실행하세요

---

## 🧪 테스트 방법

### 1. Swagger UI에서 테스트

1. 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000/api-docs` 접속
3. `GET /api/posts` 엔드포인트에서 "Try it out" 클릭
4. `category` 파라미터에 `food` 입력 후 "Execute" 클릭
5. 응답에서 `category: "food"`인 게시글만 조회되는지 확인

### 2. cURL로 테스트

```bash
# 카테고리별 조회
curl "http://localhost:3000/api/posts?category=food"

# 게시글 생성 (카테고리 포함)
curl -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "post": {
      "authorId": "your-user-id",
      "title": "테스트 게시글",
      "content": "테스트 내용",
      "price": 10000,
      "minParticipants": 2,
      "deadline": "2025-12-31T23:59:59.000Z",
      "category": "food"
    }
  }'
```

---

## 📚 관련 파일 목록

### 수정된 파일

1. `src/models/Post.ts` - Post 모델에 category 필드 추가
2. `src/routes/common/validation/post-schemas.ts` - Validation 스키마에 category 추가
3. `src/repos/PostRepo.ts` - list 메서드에 category 필터링 추가
4. `src/services/PostService.ts` - listPosts 메서드에 category 파라미터 추가
5. `src/controllers/post.controller.ts` - getAllPosts, createPost, updatePost에 category 처리 추가
6. `src/config/swagger.ts` - Post 스키마에 category 필드 추가
7. `src/routes/posts/PostRoutes.ts` - Swagger 문서에 category 파라미터 추가

---

## 🔄 향후 개선 사항

1. **카테고리 검증 강화**

   - 현재는 문자열로만 검증하지만, enum 타입으로 더 엄격하게 검증 가능
   - 잘못된 카테고리 ID 입력 시 명확한 에러 메시지 제공

2. **카테고리 통계 API**

   - 카테고리별 게시글 수 조회 API 추가
   - 예: `GET /api/posts/categories/stats`

3. **다중 카테고리 필터링**
   - 여러 카테고리를 동시에 필터링하는 기능
   - 예: `GET /api/posts?category=food,daily`

---

## 📞 문의

카테고리 기능 관련 문의사항이 있으면 개발팀에 연락해주세요.
