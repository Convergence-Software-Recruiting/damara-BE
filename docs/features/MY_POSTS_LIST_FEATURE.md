# 내 공구 탭별 리스트 API 개발 보고서

## 1. 작업 시점

```text
2026-05-17
브랜치: feature/my-posts-list-api
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
내 공구 화면 상단 카운트 API는 있었지만, 등록한 공구/참여한 공구/관심 공구 탭의 실제 카드 목록을 한 번에 내려주는 API가 없었다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드가 탭별 목록을 구성하려면 기존 게시글/참여/관심 API를 조합하고 카드 상태를 별도로 계산해야 했다.

이번 작업으로 해결하려는 것:
탭별 목록, 검색어, 상태 필터, 페이지네이션, 카드 UI 필드를 하나의 응답 계약으로 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
GET /api/users/{userId}/my-posts 단일 API에 tab 파라미터를 두고 registered, participated, favorites 탭을 모두 지원한다.

선택하지 않은 대안:
탭마다 /registered-posts, /participated-posts, /favorite-posts처럼 별도 API를 만드는 방식은 선택하지 않았다.

선택 이유:
내 공구 화면은 세 탭이 같은 카드 UI를 공유하므로 응답 형태를 통일하는 편이 프론트 구현이 단순하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/users/{userId}/my-posts/summary는 탭 상단 카운트만 제공했다.
참여 목록과 관심 목록 API는 있었지만 카드 UI 필드와 탭별 필터가 통합되어 있지 않았다.

변경 후 구현:
GET /api/users/{userId}/my-posts가 탭별 카드 목록을 페이지 객체로 반환한다.
각 item은 기존 Post 카드 필드에 myPostTab, myPostRole, myPostStatus와 참여/관심 메타를 추가로 포함한다.

호환성:
기존 API는 제거하지 않았다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/my-posts.ts
src/types/post-list.ts
src/repos/PostRepo.ts
src/repos/PostParticipantRepo.ts
src/repos/FavoriteRepo.ts
src/services/PostService.ts
src/services/UserService.ts
src/controllers/user.controller.ts
src/routes/users/UserRoutes.ts
src/config/swagger.ts

핵심 로직:
PostRepo의 공통 게시글 필터에 authorId, statuses, deadlineFrom, deadlineTo를 추가했다.
참여/관심 repo에 내 공구 탭용 목록/개수 조회를 추가했다.
UserService.listMyPosts에서 탭별 status 필터를 해석하고 Post 카드 필드를 보강한다.
PostService.enrichPostCard를 공개해 여러 화면에서 카드 UI 필드 보강 로직을 재사용한다.

새로 추가된 모델/서비스/라우트:
GET /api/users/{userId}/my-posts
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/users/{userId}/my-posts 신규 추가

요청 변경:
신규 query parameter 추가
tab, status, q, keyword, category, sort, limit, offset, deadlineSoonHours, recentDays

응답 변경:
신규 MyPostsListResponse 응답 추가

프론트엔드 수정 필요 여부:
내 공구 페이지 탭 본문은 신규 API를 사용하면 된다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

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
myPostTab
myPostRole
myPostStatus
participantStatus
participantStatusLabel
participatedAt
favoriteId
favoritedAt

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
내 공구 탭 본문은 GET /api/users/{userId}/my-posts 사용

주의할 상태값:
registered 탭 status는 inProgress/deadlineSoon/completed 또는 게시글 상태값을 사용한다.
participated 탭 status는 participantStatus 또는 게시글 상태값을 사용한다. paymentPending, pickupReady camelCase alias도 허용한다.
favorites 탭 status는 deadlineSoon/recent 또는 게시글 상태값을 사용한다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
```

로컬 서버에서 탭별 조회를 확인한다.

```bash
curl -s "http://localhost:3000/api/users/{userId}/my-posts?tab=registered&limit=5"
curl -s "http://localhost:3000/api/users/{userId}/my-posts?tab=participated&limit=5"
curl -s "http://localhost:3000/api/users/{userId}/my-posts?tab=favorites&limit=5"
```

## 10. 남은 작업

```text
후속 API:
사용자 프로필 요약 API
신뢰 요약 API
공지/FAQ API
설정 API

운영/배포 주의점:
DB 구조 변경은 없다.

테스트 보강:
탭별 status 필터와 페이지네이션에 대한 서비스 테스트를 추가할 수 있다.

문서 보강:
프론트에서 실제 사용하는 탭별 status 값이 확정되면 Swagger description을 더 좁힐 수 있다.
```
