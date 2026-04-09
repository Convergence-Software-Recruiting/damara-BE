# 프론트엔드 전달용 변경 안내서

## 게시글 구조 개편 (쇼핑하러가기 / 쇼핑메이트 / 쇼핑 후 N빵)

- 문서 버전: v1
- 작성일: 2026-04-09
- 상태: 백엔드 반영 예정(프론트 선적용 가이드)

---

## 1. 한 줄 요약

기존 "판매글처럼 보이는 단일 게시글" 구조를,  
`게시글 타입(boardType)` + `품목 카테고리(itemCategory)` 조합으로 바꿉니다.

프론트 메인에서는:
- 상단 탭: `쇼핑하러가기` / `같이 쇼핑메이트` / `쇼핑 후 N빵`
- 하단 필터: `먹거리`, `일상용품` 등 품목 카테고리 필터

---

## 2. 화면 기준 변경 포인트

### 2.1 메인 탭 (필수)

| 탭 라벨 | boardType 값 |
|---|---|
| 쇼핑하러가기 | `group_buy` |
| 같이 쇼핑메이트 | `shopping_mate` |
| 쇼핑 후 N빵 | `split_after_purchase` |

### 2.2 카테고리 필터 (선택)

| 라벨 | itemCategory 값 |
|---|---|
| 먹거리 | `food` |
| 일상용품 | `daily` |
| 뷰티/패션 | `beauty` |
| 전자기기 | `electronics` |
| 학용품 | `school` |
| 기타 | `etc` |

---

## 3. API 계약 변경 (예정)

## 3.1 게시글 목록 조회

### 기존
`GET /api/posts?category=food&limit=20&offset=0`

### 변경
`GET /api/posts?boardType=shopping_mate&itemCategory=food&limit=20&offset=0`

### 쿼리 파라미터

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `boardType` | string enum | 선택 | 메인 탭 필터 |
| `itemCategory` | string enum | 선택 | 품목 카테고리 필터 |
| `limit` | number | 선택 | 페이지 크기 |
| `offset` | number | 선택 | 오프셋 |

---

## 3.2 게시글 등록

### 기존 body
```json
{
  "post": {
    "authorId": "uuid",
    "title": "제목",
    "content": "내용",
    "price": 10000,
    "minParticipants": 2,
    "deadline": "2026-04-10T12:00:00.000Z",
    "pickupLocation": "명지대 정문",
    "category": "food"
  }
}
```

### 변경 body
```json
{
  "post": {
    "authorId": "uuid",
    "title": "제목",
    "content": "내용",
    "price": 10000,
    "minParticipants": 2,
    "deadline": "2026-04-10T12:00:00.000Z",
    "pickupLocation": "명지대 정문",
    "boardType": "group_buy",
    "itemCategory": "food"
  }
}
```

---

## 3.3 게시글 수정

- `PUT /api/posts/:id`에서도 `boardType`, `itemCategory` 수정 가능하도록 확장 예정
- 프론트는 수정 폼에서 기존 값 prefill 필요

---

## 3.4 응답 필드 (예정)

게시글 응답에 아래 필드가 추가됩니다.

```json
{
  "id": "uuid",
  "title": "계란 N빵할 분",
  "boardType": "split_after_purchase",
  "itemCategory": "food"
}
```

---

## 4. 프론트 적용 체크리스트

1. 메인 탭 상태값을 `boardType` enum으로 관리
2. 카테고리 칩/드롭다운을 `itemCategory` enum으로 관리
3. 목록 조회 API 호출 시 `boardType`, `itemCategory`를 query에 반영
4. 글쓰기 화면에서 탭 선택값이 `boardType`으로 자동 주입되도록 처리
5. 상세/수정 화면에서 `boardType`, `itemCategory` 표시 및 편집 지원
6. 잘못된 enum 값 수신 시 기본값 처리 (`group_buy`, `etc`)
7. 빈 결과 UI 처리 (조건 맞는 게시글 없음)

---

## 5. 호환성/마이그레이션 정책

백엔드 전환 초기에 기존 필드 `category`는 잠시 호환합니다.

1. 호환 기간
- 구버전 앱: `category`만 보내도 동작
- 신버전 앱: `boardType`, `itemCategory` 사용

2. 권장 대응
- 프론트는 신규 필드를 우선 사용
- 응답에 `itemCategory`가 없으면 `category`를 fallback으로 사용

---

## 6. 프론트 구현 예시

## 6.1 목록 조회 쿼리 빌더

```ts
type BoardType = "group_buy" | "shopping_mate" | "split_after_purchase";
type ItemCategory = "food" | "daily" | "beauty" | "electronics" | "school" | "etc";

function buildPostsQuery(params: {
  boardType?: BoardType;
  itemCategory?: ItemCategory;
  limit?: number;
  offset?: number;
}) {
  const q = new URLSearchParams();
  if (params.boardType) q.set("boardType", params.boardType);
  if (params.itemCategory) q.set("itemCategory", params.itemCategory);
  q.set("limit", String(params.limit ?? 20));
  q.set("offset", String(params.offset ?? 0));
  return `/api/posts?${q.toString()}`;
}
```

## 6.2 글쓰기 payload

```ts
const payload = {
  post: {
    authorId,
    title,
    content,
    price,
    minParticipants,
    deadline,
    pickupLocation,
    boardType,      // 탭에서 선택된 값
    itemCategory,   // 카테고리 필터/선택값
  },
};
```

---

## 7. QA 확인 항목

1. 탭 전환 시 각 타입 글만 노출되는지
2. 탭 + 카테고리 동시 필터가 정상 동작하는지
3. 글쓰기 후 작성한 타입 탭에서 즉시 보이는지
4. 수정 시 타입/카테고리 변경이 반영되는지
5. 필터 결과 0건일 때 UX가 정상인지

