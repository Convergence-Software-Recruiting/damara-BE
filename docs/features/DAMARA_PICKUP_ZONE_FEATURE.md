# 다마라존 공식 접선지 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-31
브랜치: feature/damara-pickup-zones
관련 커밋: 예정
```

## 2. 문제 배경

```text
기존 문제:
게시글 등록 시 수령 장소를 자유 텍스트로만 입력하면 같은 장소도 여러 표현으로 흩어진다.
예: S2810, S동 2810, 자연캠 S2810 등

사용자/운영자/프론트엔드 관점의 불편:
사용자는 어디서 만나야 하는지 매번 문구를 해석해야 하고,
프론트엔드는 지도/필터/장소 선택 UI를 안정적으로 만들기 어렵다.

이번 작업으로 해결하려는 것:
직접 입력 방식은 유지하되, 자주 쓰는 공식 접선지인 다마라존을 선택지로 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
수령 방식은 custom(직접 입력)과 damara_zone(다마라존)으로 나눈다.
다마라존 목록은 GET /api/pickup-zones API로 제공한다.
게시글은 pickupType과 pickupZoneId를 저장한다.

선택하지 않은 대안:
초기 MVP에서는 다마라존 관리용 관리자 CRUD와 별도 pickup_zones 테이블은 만들지 않는다.

선택 이유:
프론트엔드 등록 UI에 바로 붙일 수 있고,
장소 표준화 효과를 빠르게 확인할 수 있다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
pickupLocation 자유 텍스트만 사용했다.

변경 후 구현:
pickupType=custom이면 pickupLocation 직접 입력을 사용한다.
pickupType=damara_zone이면 pickupZoneId로 공식 접선지를 선택하고,
서버가 pickupLocation을 다마라존 표시명으로 채운다.

호환성:
기존처럼 pickupLocation만 보내면 custom 방식으로 처리된다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/pickup-zone.ts
src/services/PickupZoneService.ts
src/controllers/pickup-zone.controller.ts
src/routes/pickup-zones/PickupZoneRoutes.ts
src/routes/index.ts
src/common/constants/Paths.ts
src/models/Post.ts
src/services/PostService.ts
src/routes/common/validation/post-schemas.ts
src/config/swagger.ts
src/routes/posts/PostRoutes.ts

핵심 로직:
다마라존 상수 목록을 추가했다.
다마라존 목록/상세 조회 API를 추가했다.
게시글 생성/수정 시 custom/damara_zone 수령 방식을 검증한다.
damara_zone 선택 시 pickupZoneId를 검증하고 pickupLocation을 공식 표시명으로 저장한다.

새로 추가된 모델/서비스/라우트:
PickupZoneService
pickup-zone.controller
PickupZoneRoutes
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/pickup-zones
GET /api/pickup-zones/{id}
POST /api/posts
PUT /api/posts/{id}
GET /api/posts
GET /api/posts/{id}

요청 변경:
post.pickupType: custom | damara_zone
post.pickupZoneId: string | null
post.pickupLocation: string | null

응답 변경:
Post 응답에 pickupType, pickupZoneId, pickupZone이 포함된다.

프론트엔드 수정 필요 여부:
등록 화면에서 "직접 입력"과 "다마라존" 선택지를 제공하면 된다.
다마라존 선택 시 GET /api/pickup-zones 응답의 id를 pickupZoneId로 보내면 된다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: 없음
신규 컬럼:
posts.pickup_type
posts.pickup_zone_id

변경된 관계: 없음
마이그레이션 필요 여부:
운영 DB에는 ALTER 적용이 필요하다. 서버 시작 시 누락 컬럼 보정 루틴도 추가했다.

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
pickupType
pickupZoneId
pickupZone

숨겨야 할 필드:
없음

요청 payload 변경:
직접 입력:
pickupType=custom, pickupLocation 입력

다마라존:
pickupType=damara_zone, pickupZoneId 입력

호출 URL 변경:
다마라존 목록 조회: GET /api/pickup-zones

주의할 상태값:
pickupType=damara_zone이면 pickupZoneId가 필수다.
pickupType=custom이면 pickupLocation이 필수다.
```

## 9. 검증 방법

```bash
npm run build
TS_NODE_SWC=false node -r ts-node/register/transpile-only scripts/lint-openapi.ts docs/openapi/openapi.json
```

API 확인 예시:

```bash
curl -s "http://localhost:3000/api/pickup-zones"
curl -s "http://localhost:3000/api/pickup-zones/s2810"
```

게시글 등록 예시:

```bash
curl -s -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "post": {
      "authorId": "{userId}",
      "title": "간식 공동구매",
      "content": "S2810에서 같이 나눠 받을 간식 공구입니다.",
      "price": 5000,
      "minParticipants": 3,
      "deadline": "2026-06-17T23:59:59.000Z",
      "pickupType": "damara_zone",
      "pickupZoneId": "s2810"
    }
  }'
```

## 10. 남은 작업

```text
후속 API:
운영자가 다마라존을 추가/비활성화하는 관리자 API

운영/배포 주의점:
운영 DB에 posts.pickup_type, posts.pickup_zone_id 컬럼이 반영되어야 한다.

테스트 보강:
서비스 단위 pickupType 검증 테스트와 API 통합 테스트

문서 보강:
프론트 등록 화면 확정 후 다마라존 표시 순서와 안내 문구를 구체화한다.
```
