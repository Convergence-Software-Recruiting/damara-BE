# Model → Repo → Service → Controller
## 프론트엔드 개발자를 위한 “코드로 떠먹여드리는” 백엔드 레이어 가이드

이 문서는 React/TypeScript 위주로 개발해오신 분을 대상으로, 이 레포에서 **요청 1개가 들어오면 내부에서 어떤 코드가 어떤 순서로 실행되는지**를 **실제 코드**로 따라가며 설명드립니다.

요청하신 방향대로:

- 예시를 여러 개 나열하지 않고,
- 대신 **“POST /api/posts(게시글 생성)” 1개**를 기준으로,
- Model → Repo → Service → Controller가 **정확히 어떻게 소통하는지**를 “코드 단위로” 해부합니다.

보조로 “GET /api/posts/:id(상세 조회)”를 짧게 다루어, Service가 Repo 결과에 다른 도메인 정보를 어떻게 합성하는지도 보여드립니다.

---

## 1.1 이 문서의 목표: “HTTP 요청이 함수 호출 체인이 되는 과정”을 이해하기

프론트에서 아래 요청은:

```ts
await fetch("/api/posts", { method: "POST", body: JSON.stringify(...) });
```

백엔드 내부에서는 결국 다음 형태로 바뀝니다.

1. Express Router가 URL에 맞는 핸들러를 찾고
2. Controller 함수가 실행되고
3. Controller가 Service 함수를 호출하고
4. Service가 Repo 함수를 호출하고
5. Repo가 Sequelize Model의 ORM 메서드(`create`, `findByPk`, `bulkCreate`...)를 호출합니다

즉, 서버 내부에서는 **함수 호출 체인**입니다.

---

## 1.2 이 문서에서 “하나만” 끝까지 따라갈 API

**메인 시나리오**

- `POST /api/posts`
- 목적: 게시글 1건 생성 + 이미지 URL 배열을 별도 테이블에 저장

**보조 시나리오**

- `GET /api/posts/:id`
- 목적: 게시글 + 이미지 + (Service에서) 관심수/관심여부 합성

---

## 1.3 레이어 요약(딱 이 4줄만 기억하셔도 됩니다)

- **Model**: DB 테이블/관계 정의(Sequelize). “DB에 접근 가능한 버튼”을 제공.
- **Repo**: Model 버튼을 눌러서 DB 작업 수행. “SQL/ORM 옵션 조립 담당”.
- **Service**: 도메인 규칙 + 여러 Repo/Service 조합. “기능 완성 담당”.
- **Controller**: HTTP 요청을 검증/변환해서 Service 호출로 번역. “req/res 담당”.

---

## 2.1 (Model) PostModel: posts 테이블을 코드로 표현

파일: `src/models/Post.ts`

PostModel은 “posts 테이블의 스키마”를 코드로 정의합니다. 아래는 핵심만 발췌한 형태입니다.

```ts
// src/models/Post.ts
export interface PostAttributes {
  id: string;
  authorId: string;
  title: string;
  content: string;
  price: number;
  minParticipants: number;
  currentQuantity: number;
  status: "open" | "closed" | "in_progress" | "completed" | "cancelled";
  deadline: Date;
  pickupLocation: string | null;
  category: string | null;
}

export class PostModel extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: string;
  public authorId!: string;
  public title!: string;
  public content!: string;
  public price!: number;
  public minParticipants!: number;
  public currentQuantity!: number;
  public status!: "open" | "closed" | "in_progress" | "completed" | "cancelled";
  public deadline!: Date;
  public pickupLocation!: string | null;
  public category!: string | null;
}

PostModel.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    authorId: { type: DataTypes.UUID, allowNull: false, field: "author_id" },
    title: { type: DataTypes.STRING(200), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    minParticipants: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: "min_participants" },
    currentQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "current_quantity" },
    status: { type: DataTypes.ENUM("open", "closed", "in_progress", "completed", "cancelled"), allowNull: false, defaultValue: "open" },
    deadline: { type: DataTypes.DATE, allowNull: false },
    pickupLocation: { type: DataTypes.STRING(200), allowNull: true, field: "pickup_location" },
    category: { type: DataTypes.STRING(50), allowNull: true, defaultValue: null },
  },
  { sequelize, tableName: "posts", timestamps: true, underscored: true },
);
```

### 2.1.1 프론트의 타입과 뭐가 다른가요?

프론트에서 `type Post = {...}`를 쓰면 “타입 체크”만 되지만,
백엔드에서 `PostModel`은 실제로:

- `PostModel.create(...)` → DB에 `INSERT` 실행
- `PostModel.findByPk(...)` → DB에 `SELECT` 실행

즉, Model은 **DB를 건드리는 실체**입니다.

---

## 2.2 (Model) PostImageModel: post_images 테이블(이미지 전용 테이블)

파일: `src/models/PostImage.ts`

```ts
// src/models/PostImage.ts
export interface PostImageAttributes {
  id: string;
  postId: string;
  imageUrl: string;
  sortOrder: number;
}

export class PostImageModel extends Model<PostImageAttributes, PostImageCreationAttributes> implements PostImageAttributes {
  public id!: string;
  public postId!: string;
  public imageUrl!: string;
  public sortOrder!: number;
}

PostImageModel.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    postId: { type: DataTypes.UUID, allowNull: false, field: "post_id" },
    imageUrl: { type: DataTypes.STRING(500), allowNull: false, field: "image_url" },
    sortOrder: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0, field: "sort_order" },
  },
  { sequelize, tableName: "post_images", timestamps: true, underscored: true, updatedAt: false },
);
```

핵심은 이것입니다.

- 프론트는 “게시글에 images 배열 하나 달아두면 끝”이지만,
- DB는 `posts`와 `post_images`로 나뉘어 있으니,
- 서버는 “posts insert” 후 “post_images insert”까지 책임져야 합니다.

---

## 2.3 (Model) association: include가 동작하는 이유(진짜 중요)

Repo에서 자주 보실 코드:

```ts
include: [{ model: PostImageModel, as: "images" }]
```

이게 동작하려면 Model에서 “관계”를 정의해야 합니다.

파일: `src/models/PostImage.ts`

```ts
PostModel.hasMany(PostImageModel, { foreignKey: "postId", as: "images" });
PostImageModel.belongsTo(PostModel, { foreignKey: "postId", as: "post" });
```

여기서 꼭 기억해 주세요.

- `as: "images"`는 “별칭(alias)”입니다.
- Repo에서 include할 때도 반드시 `as: "images"`로 맞춰야 합니다.

> 프론트에서 “post.images로 보고 싶다”는 요구를, Sequelize에서는 association의 `as`로 구현합니다.

---

## 3.1 (Repo) PostRepo: “Model을 대신 호출하는 DB 접근 전담 계층”

파일: `src/repos/PostRepo.ts`

Repo는 한 줄로 말하면:

> “서비스/컨트롤러가 Model을 직접 만지지 못하게 막고, DB 쿼리를 모아둔 파일”

입니다.

Service/Controller가 `PostModel.findAll()` 같은 코드를 직접 쓰기 시작하면, 나중에:

- 쿼리 최적화
- 인덱스 튜닝
- 캐싱 레이어 추가
- ORM 교체

를 하려는 순간 **쿼리가 흩어져 있어서** 수정 범위가 폭발합니다.

그래서 이 프로젝트는 “DB 접근은 Repo만” 하도록 설계했습니다.

---

## 3.2 (Repo) 게시글 생성: `PostRepo.create(data, imageUrls)`

파일: `src/repos/PostRepo.ts`

핵심 구현(발췌):

```ts
// src/repos/PostRepo.ts
async create(data: PostCreationAttributes, imageUrls: string[] = []) {
  const post = await PostModel.create(data);

  if (imageUrls.length > 0) {
    await PostImageModel.bulkCreate(
      imageUrls.map((url, index) => ({
        postId: post.id,
        imageUrl: url,
        sortOrder: index,
      })),
    );
  }

  return await PostModel.findByPk(post.id, {
    include: [
      {
        model: PostImageModel,
        as: "images",
        attributes: ["id", "imageUrl", "sortOrder"],
      },
    ],
  });
}
```

이제 이 코드를 “한 줄씩 왜 필요한지”로 풀어보겠습니다.

### 3.2.1 `PostModel.create(data)` = posts 테이블에 1행 insert

```ts
const post = await PostModel.create(data);
```

- `data`는 posts 테이블에 들어갈 컬럼 값들입니다.
- 이 줄이 실행되면 DB에 `INSERT`가 나갑니다.
- 그리고 `post.id`가 생성됩니다(UUID).

**여기서 중요한 것은** `post.id`가 생겼다는 점입니다.  
이미지 테이블은 `postId`가 필요하므로, posts insert가 먼저여야 합니다.

### 3.2.2 `bulkCreate` = 이미지 여러 장을 한 번에 insert

```ts
await PostImageModel.bulkCreate(imageUrls.map(...));
```

- 이미지가 5장이면, `create` 5번 반복보다 `bulkCreate` 1번이 일반적으로 효율적입니다.
- `sortOrder: index`는 “프론트가 보낸 순서”를 DB에 저장하는 장치입니다.

즉, 프론트에서 `[urlA, urlB, urlC]`로 보내면, 서버는:

- urlA는 sortOrder 0
- urlB는 sortOrder 1
- urlC는 sortOrder 2

로 저장하여 순서를 보존합니다.

### 3.2.3 마지막 `findByPk(... include ...)`는 “클라이언트 응답 형태”를 위해 필요합니다

```ts
return await PostModel.findByPk(post.id, { include: [...] });
```

프론트가 원하는 최종 JSON 형태는 보통 이렇습니다.

```json
{
  "id": "post-uuid",
  "title": "제목",
  "images": [
    { "id": "img-uuid-1", "imageUrl": "https://...", "sortOrder": 0 }
  ]
}
```

그런데 `PostModel.create`로 얻은 `post`는:

- posts 테이블 row만 알고 있고
- `images` association은 로드되어 있지 않습니다

그래서 Repo는 “include로 묶어서 다시 조회”해서 반환합니다.

> “생성했는데 왜 다시 조회하나요?”라는 질문에 대한 답은: **association 데이터가 없기 때문**입니다.

---

## 3.3 (Repo) 상세 조회: `PostRepo.findById(id)`

파일: `src/repos/PostRepo.ts`

```ts
// src/repos/PostRepo.ts
async findById(id: string) {
  const post = await PostModel.findByPk(id, {
    include: [
      {
        model: PostImageModel,
        as: "images",
        attributes: ["id", "imageUrl", "sortOrder"],
        order: [["sortOrder", "ASC"]],
      },
    ],
  });

  return post ? post.get() : null;
}
```

### 3.3.1 `post.get()`은 “Sequelize 인스턴스 → 순수 객체” 변환입니다

Sequelize 인스턴스에는 다음처럼 “DB row 외의 것”이 섞여 있습니다.

- `save`, `update` 같은 메서드
- 내부 메타 필드

Controller에서 `res.json(...)`로 응답할 때는 “순수 데이터만” 있는 편이 안전하고 깔끔합니다.  
그래서 Repo는 `post.get()`으로 변환한 값을 반환합니다.

> 프론트에서 클래스 인스턴스를 그대로 `JSON.stringify` 하는 느낌의 불안함을, 서버에서도 똑같이 느낀다고 생각하시면 됩니다.

---

## 4.1 (Service) Service는 “도메인 규칙 + 조합”을 담당합니다

파일: `src/services/PostService.ts`

Repo가 “DB를 어떻게 만질지”만 책임진다면,  
Service는 “이 기능이 비즈니스적으로 완성되려면 무엇을 해야 하는지”를 책임집니다.

예를 들어 게시글 생성에서는:

- authorId가 실제 유저인지 확인해야 하고
- 실패하면 404를 내려야 합니다

그리고 게시글 상세 조회에서는:

- 게시글이 없으면 404를 내려야 하고
- (선택적으로) 관심 수/관심 여부 같은 “다른 도메인 정보”를 합쳐서 내려줄 수 있습니다

---

## 4.2 (Service) 게시글 생성: `PostService.createPost(data, imageUrls)`

파일: `src/services/PostService.ts`

핵심 구현(발췌):

```ts
// src/services/PostService.ts
async createPost(data: PostCreationAttributes, imageUrls: string[] = []) {
  const author = await UserModel.findByPk(data.authorId);
  if (!author) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "AUTHOR_NOT_FOUND");
  }

  const post = await PostRepo.create(data, imageUrls);
  return post?.get();
}
```

이 함수는 딱 두 단계로 생각하시면 됩니다.

### 4.2.1 1단계: 작성자 존재 확인(도메인 규칙)

```ts
const author = await UserModel.findByPk(data.authorId);
if (!author) throw new RouteError(404, "AUTHOR_NOT_FOUND");
```

프론트에서 “authorId를 보내면 되겠지”라고 생각하지만, 백엔드는 이걸 그대로 믿지 않습니다.

- 존재하지 않는 authorId로 posts를 만들면 “잘못된 데이터”가 생깁니다.
- 그래서 Service가 먼저 확인하고, 없으면 즉시 404로 종료합니다.

여기서 Repo가 아니라 Service에서 확인하는 이유는:

- 이 실패는 “DB 쿼리 실패”가 아니라,
- “비즈니스 관점의 실패(작성자가 없음)”이기 때문입니다.

### 4.2.2 2단계: DB 저장은 Repo에 위임

```ts
const post = await PostRepo.create(data, imageUrls);
```

Service는 “게시글을 저장해 주세요”라고 Repo에 부탁만 합니다.  
posts insert / images insert / include 재조회 같은 DB 세부 구현은 Service의 관심사가 아닙니다.

### 4.2.3 마지막 `.get()`은 “응답용 순수 객체”를 만들기 위함

```ts
return post?.get();
```

`PostRepo.create`는 마지막에 `PostModel.findByPk` 결과(Sequelize 인스턴스)를 반환합니다.  
Service는 이걸 `.get()`으로 순수 객체로 바꿔서 Controller가 바로 `res.json(...)` 할 수 있게 합니다.

---

## 4.3 (Service) 게시글 상세 조회(+관심수 합성): `PostService.getPostById(id, userId?)`

파일: `src/services/PostService.ts`

핵심 구현(발췌):

```ts
// src/services/PostService.ts
async getPostById(id: string, userId?: string) {
  const post = await PostRepo.findById(id);
  if (!post) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
  }

  const favoriteCount = await FavoriteService.getFavoriteCount(id);

  let isFavorite = false;
  if (userId) {
    isFavorite = await FavoriteService.isFavorite(id, userId);
  }

  return {
    ...post,
    favoriteCount,
    isFavorite,
  };
}
```

여기서 중요한 관점은 다음입니다.

### 4.3.1 Repo는 “posts + images”까지만 책임집니다

```ts
const post = await PostRepo.findById(id);
```

Repo는 DB에서 게시글과 이미지를 가져옵니다. 그 이상은 하지 않습니다.

### 4.3.2 Service는 “프론트가 화면 구성하기 좋은 형태”로 합성합니다

```ts
return { ...post, favoriteCount, isFavorite };
```

프론트 화면에서는 “게시글 정보”만으로 끝나는 경우가 드뭅니다.

- 관심 수가 몇 개인지
- 내가 관심 등록을 했는지

같은 정보가 같이 필요합니다.  
그런데 이건 posts 테이블만 조회해서는 나오지 않으니, Service가 다른 Service(`FavoriteService`)를 호출해 합성해줍니다.

> 이 패턴(Repo로 기본 데이터 + Service에서 합성)은 백엔드에서 매우 자주 등장합니다.

---

## 5.1 (Controller) Controller는 “HTTP(req/res) ↔ Service 호출” 번역기입니다

파일: `src/controllers/post.controller.ts`

Controller가 하는 일은 단순합니다.

1) 요청에서 값 꺼내기(req)
2) 검증/변환하기
3) Service 호출하기
4) 응답 만들기(res)
5) 에러는 next(error)로 위임하기

---

## 5.2 (Router) `POST /api/posts`는 어떤 함수가 받나요?

파일: `src/routes/posts/PostRoutes.ts`

```ts
postRouter.post("/", createPost);
```

즉, `POST /api/posts` 요청이 오면 **Controller의 `createPost` 함수가 실행**됩니다.

---

## 5.3 (Controller) 게시글 생성: `createPost(req, res, next)`

파일: `src/controllers/post.controller.ts`

핵심 구현(발췌):

```ts
export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = parseReq<CreatePostReq>(createPostSchema)(req.body);
    const { post } = validatedData;

    const { images = [], deadline, category, ...postData } = post;

    const normalizedCategory =
      category && String(category).trim() !== ""
        ? String(category).trim()
        : null;

    const createdPost = await PostService.createPost(
      {
        ...postData,
        deadline: new Date(deadline),
        category: normalizedCategory,
      },
      images,
    );

    res.status(HttpStatusCodes.CREATED).json(createdPost);
  } catch (error) {
    next(error);
  }
}
```

이 컨트롤러를 “한 번 더” 아주 천천히 나누어보겠습니다.

### 5.3.1 Controller는 먼저 검증합니다: `parseReq(createPostSchema)(req.body)`

파일: `src/routes/common/validation/parseReq.ts`

```ts
export function parseReq<T>(schema: z.ZodType<T>) {
  return (input: unknown): T => {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "VALIDATION_ERROR");
    }
    return result.data;
  };
}
```

이 구조의 장점:

- Controller에서 “검증 실패 처리”를 매번 직접 할 필요가 없습니다.
- 실패하면 `RouteError(400)`가 던져지고, 전역 에러 핸들러가 응답을 만들어 줍니다.

### 5.3.2 createPostSchema는 무엇을 검증하나요?

파일: `src/routes/common/validation/post-schemas.ts`

```ts
export const createPostSchema = z.object({
  post: z.object({
    authorId: z.string().uuid(),
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    price: z.number().positive(),
    minParticipants: z.number().int().positive(),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val))),
    pickupLocation: z.string().max(200),
    images: z.array(z.string().min(1)).optional(),
    category: z.enum(["food", "daily", "beauty", "electronics", "school", "freemarket"]).optional().nullable(),
  }),
});
```

이 스키마가 “프론트가 보내야 하는 body의 형태”를 정의합니다.

프론트 입장에서:

- `authorId`가 UUID 형식이 아니면 400이 난다
- `deadline`이 Date.parse 불가능하면 400이 난다

같은 것을 “백엔드가 런타임에서 보장”하는 장치입니다.

### 5.3.3 Controller는 HTTP 입력을 내부 타입으로 변환합니다(Date, null 처리)

```ts
deadline: new Date(deadline),
category: normalizedCategory,
```

- HTTP로 들어온 deadline은 문자열이지만
- DB/도메인에서는 Date가 편하므로 Date로 바꿉니다
- category는 `""` 같은 애매한 값 대신 `null`로 통일합니다

### 5.3.4 Controller는 Service 호출 이후, 응답만 만듭니다

```ts
const createdPost = await PostService.createPost(...);
res.status(201).json(createdPost);
```

여기서부터는 “DB가 어떻게 저장되는지”를 Controller가 몰라도 됩니다.  
그건 Service/Repo/Model의 일입니다.

---

## 6.1 (Error) 에러가 JSON 응답으로 바뀌는 마지막 단계

이 프로젝트는 에러를 `RouteError`로 통일합니다.

파일: `src/common/util/route-errors.ts`

```ts
export class RouteError extends Error {
  public status: HttpStatusCodes;
  public constructor(status: HttpStatusCodes, message: string) {
    super(message);
    this.status = status;
  }
}
```

그리고 최종적으로 전역 에러 핸들러가 응답을 만들어줍니다.

파일: `src/app.ts`

```ts
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof RouteError) {
    return res.status(err.status).json({ error: err.message });
  }
  return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "INTERNAL_SERVER_ERROR" });
});
```

따라서 예를 들어:

- Service에서 `throw new RouteError(404, "AUTHOR_NOT_FOUND")`를 던지면
- Controller는 `next(error)`로 넘기고
- 최종 응답은 아래처럼 됩니다.

```json
{ "error": "AUTHOR_NOT_FOUND" }
```

---

## 7.1 (핵심) “POST /api/posts” 한 번이 실제로 지나가는 길

여기서는 “진짜 실행 순서”만 적겠습니다.

### 7.1.1 Router

- `src/routes/posts/PostRoutes.ts`
  - `postRouter.post("/", createPost);`

### 7.1.2 Controller

- `src/controllers/post.controller.ts`
  - `createPost(req, res, next)`
    1) `parseReq(createPostSchema)(req.body)`로 검증  
    2) `deadline: string → Date`, `category: "" → null` 변환  
    3) `PostService.createPost(data, images)` 호출  
    4) `res.status(201).json(createdPost)` 반환

### 7.1.3 Service

- `src/services/PostService.ts`
  - `createPost(data, imageUrls)`
    1) `UserModel.findByPk(authorId)`로 작성자 존재 확인  
    2) `PostRepo.create(data, imageUrls)` 호출  
    3) `.get()`으로 순수 객체로 변환해 반환

### 7.1.4 Repo

- `src/repos/PostRepo.ts`
  - `create(data, imageUrls)`
    1) `PostModel.create(data)` → posts insert  
    2) `PostImageModel.bulkCreate([...])` → post_images insert  
    3) `PostModel.findByPk(id, { include: images })` → 게시글+이미지 재조회  

### 7.1.5 Model/DB

- `PostModel` / `PostImageModel`이 실제 SQL을 실행합니다.

---

## 8.1 (보조) “GET /api/posts/:id”는 왜 Service가 더 빛나나요?

게시글 상세 조회는 단순히 “posts 테이블에서 한 건 가져오기”로 끝나지 않는 경우가 많습니다.

이 프로젝트에서는 `getPostById`가:

- Repo에서 게시글+이미지를 가져오고
- FavoriteService에서 관심 수/여부를 가져와 합성해서
- 프론트가 쓰기 좋은 DTO로 만들어 반환합니다

이런 식으로 “DB 모델에 없는 값(집계/파생)”은 Service에서 합성하는 것이 일반적입니다.

---

## 9.1 (선택) 참여 흐름은 “Repo가 여러 Model을 섞어 방어”하는 예시입니다

참여 기능을 이해하시려면 아래 두 파일만 보셔도 흐름이 잡힙니다.

### 9.1.1 PostParticipantRepo가 방어하는 것(DB 관점)

파일: `src/repos/PostParticipantRepo.ts`

- Post 존재 확인: `PostModel.findByPk(postId)`
- User 존재 확인: `UserModel.findByPk(userId)`
- 작성자 참여 방지: `post.authorId === userId`
- 모집 상태 확인: `post.status === "open"`
- unique 제약 위반을 `ALREADY_PARTICIPATED`로 변환

### 9.1.2 PostParticipantService가 처리하는 것(도메인 효과)

파일: `src/services/PostService.ts` (`PostParticipantService`)

- 참여/취소 후 참여자 수를 다시 세고
- posts 테이블의 `currentQuantity`를 업데이트하고
- 알림/신뢰점수 같은 후처리를 수행합니다

---

## 10.1 마지막 정리(여기까지 이해하시면 됩니다)

- Model은 “DB 스키마 + include를 가능하게 하는 관계 정의”입니다.
- Repo는 “Model을 호출해서 DB 작업을 수행하는 전담 계층”입니다.
- Service는 “Repo 결과를 사용해 도메인 규칙을 적용하고 필요한 값을 합성하는 계층”입니다.
- Controller는 “HTTP 입력을 검증/변환해서 Service 호출로 번역하고 응답을 반환하는 계층”입니다.

원하시면 다음 단계로, 이 문서에서 다룬 “POST /api/posts”를 기준으로:

- “각 단계에서 실제로 어떤 객체 형태로 값이 오가는지(타입/예시 JSON 포함)”
- “에러 케이스별(VALIDATION_ERROR, AUTHOR_NOT_FOUND 등) 프론트 처리 전략”

까지 더 ‘실무형’으로 확장해서 정리해드릴 수도 있습니다.
