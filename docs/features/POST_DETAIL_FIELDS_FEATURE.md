# Post 등록/상세 UI 필드 확장 개발 보고서

## 1. 작업 시점

```text
2026-05-16
브랜치: feature/post-detail-fields
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
공동구매 등록/상세 화면은 상품명, 수령 날짜/시간, 수령 안내, 공구 유형, 태그, 공지 같은 UI 필드를 필요로 하지만 posts 테이블과 API 계약에는 title, content, deadline, pickupLocation 중심의 기본 필드만 있었다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드가 상세 화면을 구성하려면 기존 필드를 임의로 재해석하거나, 화면에 필요한 정보를 저장하지 못하는 상태였다.

이번 작업으로 해결하려는 것:
등록/수정 요청에서 상세 UI 필드를 받을 수 있게 하고, 목록/상세 응답에서도 같은 필드를 내려준다.
```

## 3. 기획 방향

```text
선택한 방향:
기존 필드는 유지하고, 신규 UI 필드는 모두 nullable/optional 컬럼으로 추가한다.

선택하지 않은 대안:
기존 title, content, deadline, pickupLocation의 의미를 바꿔서 프론트가 재사용하게 하는 방식은 선택하지 않았다.

선택 이유:
기존 앱과 데이터 호환성을 유지하면서 새 화면 요구사항을 직접 표현할 수 있다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
posts 테이블은 title, content, price, minParticipants, deadline, pickupLocation, category 중심이었다.

변경 후 구현:
posts 테이블과 Post API 계약에 productName, pickupDate, pickupStartTime, pickupEndTime, pickupGuide, groupBuyType, tags, notice가 추가된다.

호환성:
신규 필드는 nullable/optional이다. productName이 없으면 응답에서 title을 fallback으로 내려준다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/models/Post.ts
src/app.ts
src/routes/common/validation/post-schemas.ts
src/controllers/post.controller.ts
src/services/PostService.ts
src/repos/PostRepo.ts
src/config/swagger.ts
src/routes/posts/PostRoutes.ts

핵심 로직:
Post 모델에 신규 컬럼을 추가한다.
등록/수정 요청 검증 스키마에 신규 필드를 추가한다.
요청 값의 빈 문자열과 빈 태그 배열은 null로 정규화한다.
productName 응답은 값이 없을 때 title을 fallback으로 사용한다.
검색 대상에 productName, pickupGuide, notice를 추가한다.
sequelize alter 실패 상황을 보완하기 위해 posts 신규 컬럼 확인 루틴을 추가한다.

새로 추가된 모델/서비스/라우트:
신규 라우트는 없다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/posts
GET /api/posts/{id}
POST /api/posts
PUT /api/posts/{id}
PATCH /api/posts/{id}/status
GET /api/posts/student/{studentId}
GET /api/users/{userId}/favorites

요청 변경:
POST /api/posts, PUT /api/posts/{id}의 post 객체에 신규 필드 추가

응답 변경:
Post, PostDetail 응답에 신규 필드 추가

프론트엔드 수정 필요 여부:
새 등록/상세 화면에서는 신규 필드를 사용해야 한다. 기존 호출은 그대로 동작한다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: 없음
신규 컬럼:
posts.product_name
posts.pickup_date
posts.pickup_start_time
posts.pickup_end_time
posts.pickup_guide
posts.group_buy_type
posts.tags
posts.notice

변경된 관계: 없음
마이그레이션 필요 여부:
운영 DB에는 명시적인 ALTER 적용을 권장한다. 서버 시작 시 누락 컬럼 보정 루틴도 추가했다.

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
productName
pickupDate
pickupStartTime
pickupEndTime
pickupGuide
groupBuyType
tags
notice

숨겨야 할 필드:
없음

요청 payload 변경:
등록/수정 화면에서 신규 필드를 post 객체에 포함할 수 있다.

호출 URL 변경:
없음

주의할 상태값:
pickupStartTime, pickupEndTime은 HH:mm 또는 HH:mm:ss 형식으로 보내야 한다.
pickupDate는 YYYY-MM-DD 형식으로 보내야 한다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
```

필요하면 로컬 서버에서 신규 필드 등록/상세 응답을 확인한다.

```bash
curl -s http://localhost:3000/api-docs.json
```

## 10. 남은 작업

```text
후속 API:
PDF 기준 사용자 요약, 신뢰 요약, 공지/FAQ, 설정, 알림/채팅 계약 보강이 남아 있다.

운영/배포 주의점:
운영 DB에는 posts 신규 컬럼 ALTER를 먼저 적용하는 편이 안전하다.

테스트 보강:
등록/수정 요청의 날짜/시간 검증과 productName fallback 동작에 대한 서비스 테스트를 추가할 수 있다.

문서 보강:
프론트 요청 예시가 확정되면 groupBuyType 허용값을 enum으로 좁힐 수 있다.
```
