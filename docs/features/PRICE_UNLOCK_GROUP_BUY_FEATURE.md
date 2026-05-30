# 모이면 싸지는 공구 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-30
브랜치: main
관련 커밋: 예정
```

## 2. 문제 배경

```text
기존 문제:
기획상 A/B 거래 방식은 선모집형/후모집형으로 나뉘지만,
백엔드에서는 groupBuyType 문자열을 저장하는 수준이라 거래 방식별 정책과 표시값이 약했다.

사용자/운영자/프론트엔드 관점의 불편:
사용자는 공동구매에 참여해도 가격이나 조건이 좋아지는 체감이 적고,
프론트엔드는 거래 방식 문구를 직접 계산해야 했다.

이번 작업으로 해결하려는 것:
선모집형 공동구매에 "모이면 싸지는 공구" 모드를 추가하고,
백엔드가 가격 해금 상태와 안내 문구를 계산해 내려준다.
```

## 3. 기획 방향

```text
선택한 방향:
A/B 구조는 유지한다.
groupBuyType은 pre_recruit/post_recruit로 고정한다.
1차 세부 모드는 price_unlock 하나만 추가한다.
프론트 부담을 줄이기 위해 dealMessage를 백엔드에서 계산한다.

선택하지 않은 대안:
다단계 가격표, 박스 쪼개기, 번개 수령은 이번 범위에서 제외한다.

선택 이유:
한 단계 가격 해금은 공동구매의 본질을 살리면서도 등록/카드/상세 화면 변경이 작다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
groupBuyType은 nullable 문자열이었다.
선모집/후모집 의미를 백엔드가 강제하지 않았다.
가격은 price 하나만 내려갔다.

변경 후 구현:
groupBuyType은 pre_recruit/post_recruit 계약으로 사용한다.
groupBuyMode는 normal/price_unlock을 지원한다.
price_unlock은 선모집형에서만 유효하다.
targetParticipants와 targetPrice를 기준으로 currentPrice, participantsToUnlock, priceUnlocked, dealMessage를 계산한다.

호환성:
기존 게시글처럼 groupBuyType/groupBuyMode가 비어 있으면 응답에서 pre_recruit/normal로 보정한다.
normal 모드에서는 targetParticipants와 targetPrice를 null로 정리한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/group-buy.ts
src/models/Post.ts
src/routes/common/validation/post-schemas.ts
src/controllers/post.controller.ts
src/services/PostService.ts
src/repos/PostRepo.ts
src/app.ts
src/config/swagger.ts
src/routes/posts/PostRoutes.ts

핵심 로직:
거래 방식 enum과 label을 추가했다.
Post 모델에 groupBuyMode, targetParticipants, targetPrice를 추가했다.
Post 생성/수정 시 price_unlock 정책을 검증한다.
Post 목록/상세/참여 스냅샷 응답에 가격 해금 계산 필드를 추가한다.
서버 시작 시 posts 신규 컬럼을 확인해 누락 시 추가한다.

새로 추가된 모델/서비스/라우트:
신규 라우트는 없다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
POST /api/posts
PUT /api/posts/{id}
GET /api/posts
GET /api/posts/{id}
POST /api/posts/{id}/participate
DELETE /api/posts/{id}/participate/{userId}
GET /api/posts/student/{studentId}
GET /api/users/{userId}/my-posts
GET /api/users/{userId}/favorites

요청 변경:
post.groupBuyType: pre_recruit | post_recruit
post.groupBuyMode: normal | price_unlock
post.targetParticipants: number | null
post.targetPrice: number | null

응답 변경:
Post 응답에 currentPrice, participantsToUnlock, priceUnlocked, dealMessage 추가

프론트엔드 수정 필요 여부:
최소 구현은 dealMessage만 표시하면 된다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: 없음
신규 컬럼:
posts.group_buy_mode
posts.target_participants
posts.target_price

변경된 관계: 없음
마이그레이션 필요 여부:
운영 DB에는 ALTER 적용이 필요하다. 서버 시작 시 누락 컬럼 보정 루틴도 추가했다.

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
currentPrice
participantsToUnlock
priceUnlocked
dealMessage

숨겨야 할 필드:
없음

요청 payload 변경:
가격 해금 공구 등록 시 groupBuyType=pre_recruit, groupBuyMode=price_unlock, targetParticipants, targetPrice를 보낸다.

호출 URL 변경:
없음

주의할 상태값:
price_unlock은 pre_recruit에서만 사용한다.
normal 모드에서는 dealMessage가 null이다.
```

## 9. 검증 방법

```bash
npm test -- tests/routes/post-schemas.test.ts
npm run openapi:generate
npm run openapi:lint
npm run build
```

로컬 서버 API 확인 예시:

```bash
curl -s -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "post": {
      "authorId": "{userId}",
      "title": "물티슈 공동구매",
      "content": "도톰한 물티슈를 같이 구매합니다.",
      "price": 5000,
      "minParticipants": 3,
      "deadline": "2026-06-17T23:59:59.000Z",
      "pickupLocation": "명지대 정문",
      "groupBuyType": "pre_recruit",
      "groupBuyMode": "price_unlock",
      "targetParticipants": 5,
      "targetPrice": 4500
    }
  }'
```

## 10. 남은 작업

```text
후속 API:
다단계 가격표가 필요하면 pricingTiers 별도 JSON 또는 child table을 추가한다.

운영/배포 주의점:
posts 신규 컬럼이 운영 DB에 반영되어야 한다.

테스트 보강:
서비스 단위 가격 해금 계산 테스트와 참여 후 participantsToUnlock 감소 테스트를 추가하면 좋다.

문서 보강:
프론트 등록 화면 확정 후 입력 필드명과 helper 문구를 더 구체화한다.
```
