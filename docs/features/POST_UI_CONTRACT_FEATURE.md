# Post UI 계약 응답 보강 개발 보고서

## 1. 작업 시점

```text
2026-05-16
브랜치: feature/post-ui-contract
관련 커밋: 작업 전
```

## 2. 문제 배경

```text
기존 문제:
GET /api/posts가 배열을 직접 반환하고, 목록 카드에 필요한 사용자 기준 상태와 마감 계산 필드가 부족했다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드는 홈, 카테고리, 검색, 상세 화면에서 찜 여부, 참여 여부, 작성자 여부, 대표 이미지, 마감 상태를 별도 계산하거나 추가 API로 확인해야 했다.

이번 작업으로 해결하려는 것:
목록/상세/참여/찜 응답을 UI 계약에 맞춰 정리해 목데이터와 임시 계산을 줄인다.
```

## 3. 기획 방향

```text
선택한 방향:
Post 관련 응답에 카드와 상세 UI가 바로 사용할 수 있는 파생 필드를 포함한다.

선택하지 않은 대안:
프론트에서 기존 배열 응답을 유지하고 각 카드마다 checkFavorite, checkParticipation API를 추가 호출하는 방식.

선택 이유:
목록 렌더링 속도와 상태 일관성을 높이고, 서버 기준 마감 계산을 사용하기 위해서다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/posts는 Post 배열을 직접 반환했다.
목록 응답에는 favoriteCount, isFavorite만 포함했다.
참여/참여취소 응답은 전체 상세 형태에 가까운 post를 내려줬다.
찜 등록/해제 응답은 최신 favoriteCount를 주지 않았다.

변경 후 구현:
GET /api/posts는 items, total, limit, offset, hasNext를 포함하는 페이지 객체를 반환한다.
목록 item에는 isFavorite, isParticipant, isOwner, thumbnailUrl, deadlineStatus, deadlineLabel, remainingSeconds가 포함된다.
상세 응답에는 participantsPreview, participantsTotal, isOwner, thumbnailUrl, deadline 계산 필드가 포함된다.
참여/참여취소와 찜 등록/해제는 UI 갱신에 필요한 최소 결과를 반환한다.

호환성:
GET /api/posts 응답이 배열에서 객체로 바뀌는 breaking change가 있다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/services/PostService.ts
src/repos/PostRepo.ts
src/controllers/post.controller.ts
src/services/FavoriteService.ts
src/controllers/favorite.controller.ts
src/repos/PostParticipantRepo.ts
src/routes/posts/PostRoutes.ts
src/config/swagger.ts

핵심 로직:
목록 전체 개수 조회 추가
목록 item enrichment 확장
서버 기준 deadline meta 계산
deadline 정렬 시 마감 전 게시글 우선 적용
popular 정렬 기준 변경
카테고리 한글 라벨 검색 보강
참여/찜 mutation 응답 정리

새로 추가된 모델/서비스/라우트:
신규 라우트와 DB 모델은 없다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/posts
GET /api/posts/{id}
POST /api/posts/{id}/participate
DELETE /api/posts/{id}/participate/{userId}
POST /api/posts/{postId}/favorite
DELETE /api/posts/{postId}/favorite/{userId}

요청 변경:
없음

응답 변경:
GET /api/posts가 배열에서 페이지 객체로 변경된다.
목록/상세 응답에 UI 파생 필드가 추가된다.
참여/찜 mutation 응답이 최신 상태와 카운트를 반환한다.

프론트엔드 수정 필요 여부:
필요. 목록 화면은 response.items를 사용해야 한다.

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
ERD 변경 이력 문서: 해당 없음
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
isFavorite
isParticipant
isOwner
thumbnailUrl
deadlineStatus
deadlineLabel
remainingSeconds
participantsPreview
participantsTotal

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
없음

주의할 상태값:
deadlineStatus는 open, closingSoon, closed 중 하나다.
participant error code는 OWNER_CANNOT_PARTICIPATE, POST_CLOSED를 사용한다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
npm run openapi:diff:breaking -- /tmp/damara-openapi-main.json docs/openapi/openapi.json
```

로컬 서버에서 확인할 API:

```bash
curl -s "http://localhost:3000/api/posts?status=open&sort=latest&limit=20&offset=0&userId={userId}"
curl -s "http://localhost:3000/api/posts/{postId}?userId={userId}"
```

## 10. 남은 작업

```text
후속 API:
Post 상세 DB 필드 확장(productName, pickupDate, pickupGuide, groupBuyType, tags, notice)
마이페이지 통합 summary API
공지사항/FAQ/설정 API

운영/배포 주의점:
GET /api/posts 응답이 배열에서 객체로 바뀌므로 프론트 배포 타이밍을 맞춰야 한다.

테스트 보강:
목록 응답 페이지 메타, 사용자 기준 상태, 참여/찜 mutation 응답 테스트가 필요하다.

문서 보강:
프론트 연동 가이드에 response.items 사용을 명시하면 좋다.
```
