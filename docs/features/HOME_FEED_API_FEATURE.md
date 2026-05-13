# 홈 피드 목록 API 확장 개발 보고서

## 1. 작업 시점

```text
2026-05-12
브랜치: feature/home-feed-api
관련 커밋: 작업 전 7a8eeb8
```

## 2. 문제 배경

```text
기존 문제:
GET /api/posts는 limit, offset, category만 지원해 메인 홈 화면의 인기 카드, 정렬 탭, 검색, 하트 상태를 한 번에 처리하기 어려웠다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드는 인기 공동구매, 최신순, 마감임박순, 검색 결과를 만들기 위해 클라이언트에서 별도 정렬/보정 로직을 가져야 했다.
목록 응답에는 isFavorite가 없어 홈 카드와 리스트의 하트 상태를 표시하려면 게시글별 추가 호출이 필요했다.

이번 작업으로 해결하려는 것:
기존 게시글 목록 API를 홈 피드 기준으로 확장해 화면별 목록 조회를 같은 엔드포인트에서 처리한다.
```

## 3. 기획 방향

```text
선택한 방향:
GET /api/posts를 확장해 검색, 상태 필터, 홈 피드 정렬, 사용자별 관심 여부를 지원한다.

선택하지 않은 대안:
GET /api/posts/popular 같은 섹션별 전용 API는 만들지 않았다.
배너 캐러셀 API는 이번 범위에 포함하지 않았다.

선택 이유:
프론트 화면은 같은 게시글 리소스를 서로 다른 정렬/필터로 보여주는 형태라 엔드포인트를 나누는 것보다 목록 API 확장이 단순하다.
배너는 현재 게시글 도메인과 별도 운영 리소스가 없어 정적 이미지 또는 추후 배너 관리 기능으로 분리하는 편이 안전하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/posts는 limit, offset, category만 받았다.
목록 응답에는 favoriteCount, isFavorite가 보장되지 않았다.

변경 후 구현:
sort, status, keyword, q, userId, x-user-id를 추가로 받는다.
목록 응답 각 게시글에 favoriteCount와 isFavorite를 포함한다.
popular 정렬은 favoriteCount, currentQuantity, createdAt 순으로 계산한다.

호환성:
기존 배열 응답 형식은 유지했다.
기존 limit, offset, category 호출은 계속 동작한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/post-list.ts
src/controllers/post.controller.ts
src/services/PostService.ts
src/repos/PostRepo.ts
src/routes/posts/PostRoutes.ts

핵심 로직:
PostRepo.list에서 category/status/keyword 필터와 latest/deadline 정렬을 처리한다.
PostService.listPosts에서 favoriteCount/isFavorite를 목록 항목에 보강한다.
popular 정렬은 보강된 favoriteCount 기준으로 정렬한 뒤 offset/limit을 적용한다.

새로 추가된 모델/서비스/라우트:
신규 DB 모델, 서비스, 라우트는 없다.
목록 옵션 타입만 src/types/post-list.ts에 추가했다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: GET /api/posts
요청 변경: sort, status, keyword, q, userId, x-user-id 추가
응답 변경: 목록 항목에 favoriteCount, isFavorite 포함
프론트엔드 수정 필요 여부: 있음
Swagger 변경 이력 문서: docs/api/SWAGGER_CHANGELOG.md
```

프론트엔드 호출 기준:

```text
인기 공동구매: GET /api/posts?sort=popular&status=open&limit=6
최신순: GET /api/posts?sort=latest&status=open&limit=20&offset=0
마감임박순: GET /api/posts?sort=deadline&status=open&limit=20&offset=0
카테고리: GET /api/posts?category=daily&sort=latest&status=open
검색: GET /api/posts?keyword=물티슈&status=open
```

사용자별 하트 상태가 필요하면 `x-user-id` 헤더를 우선 사용하고, 앱 구조상 헤더 주입이 어렵다면 `userId` 쿼리를 사용한다.

## 7. ERD/DB 영향

```text
변경 여부: 없음
신규 테이블: 없음
신규 컬럼: 없음
변경된 관계: 없음
마이그레이션 필요 여부: 없음
ERD 변경 이력 문서: 변경 없음
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
favoriteCount
isFavorite

숨겨야 할 필드:
trustScore는 기존 정책대로 사용자 노출 우선 필드가 아니다.

요청 payload 변경:
GET 목록 조회 쿼리만 추가되며 body 변경은 없다.

호출 URL 변경:
기존 /api/posts를 유지한다.
정렬/필터/검색 조건만 쿼리로 추가한다.

주의할 상태값:
홈 모집중 목록은 status=open을 사용한다.
인기순은 서버에서 favoriteCount, currentQuantity, createdAt 순으로 계산한다.
```

## 9. 검증 방법

```bash
npm run build
```

로컬 서버 실행 후 확인:

```bash
curl -s "http://localhost:3000/api/posts?sort=popular&status=open&limit=6"
curl -s "http://localhost:3000/api/posts?keyword=물티슈&status=open"
curl -s "http://localhost:3000/api-docs.json"
```

## 10. 남은 작업

```text
후속 API:
운영형 배너 캐러셀이 필요하면 banner 테이블과 배너 조회/관리 API를 별도 기능으로 설계한다.
캠퍼스별 게시글 분리가 필요하면 posts에 campus 또는 campusId 컬럼을 추가하는 DB 변경 작업이 필요하다.

운영/배포 주의점:
DB 마이그레이션은 필요 없다.
인기순은 현재 목록 후보를 가져온 뒤 favoriteCount를 계산하므로 데이터가 커지면 집계 쿼리 또는 캐시로 최적화할 수 있다.

테스트 보강:
GET /api/posts sort=latest 기본값
GET /api/posts sort=deadline 마감일 오름차순
GET /api/posts sort=popular 좋아요 수 우선 정렬
GET /api/posts keyword 검색
GET /api/posts userId 기준 isFavorite 응답

문서 보강:
프론트엔드 API 사용 가이드에 홈 화면 호출 예시를 연결한다.
```
