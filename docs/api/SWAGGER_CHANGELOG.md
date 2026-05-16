# Swagger/OpenAPI 변경 이력

이 문서는 Swagger 문서가 코드 변경과 함께 어떻게 바뀌었는지 남기는 기록이다.

Swagger는 프론트엔드와 백엔드가 API 계약을 맞추는 기준점이다. 따라서 라우트, 요청 바디, 응답 스키마, 에러 응답, 서버 URL 동작이 바뀌면 이 문서에도 변경 내용을 추가한다.

## 업데이트 원칙

Swagger 관련 변경이 생기면 다음 순서로 기록한다.

1. 변경 날짜와 브랜치를 적는다.
2. 변경 전 기준 커밋을 적는다.
3. 어떤 스키마나 엔드포인트가 바뀌었는지 적는다.
4. 프론트엔드에 영향이 있는지 적는다.
5. 배포 후 확인할 Swagger URL이나 curl 명령을 적는다.

확인 기준은 다음 파일이다.

```text
src/config/swagger.ts
src/routes/**/*.ts
```

배포 환경에서는 다음 URL로 최종 OpenAPI JSON을 확인한다.

```text
https://damara.bluerack.org/api-docs.json
```

## 2026-05-16 - Post UI 계약 응답 보강

브랜치:

```text
feature/post-ui-contract
```

변경 전 기준 커밋:

```text
26bbce5
```

### 변경 요약

홈, 카테고리, 검색, 상세, 참여, 찜 화면이 카드 상태를 별도 API 조합 없이 렌더링할 수 있도록 Post 관련 응답 계약을 보강했다.

### 변경된 API

```text
GET /api/posts
GET /api/posts/{id}
POST /api/posts/{id}/participate
DELETE /api/posts/{id}/participate/{userId}
POST /api/posts/{postId}/favorite
DELETE /api/posts/{postId}/favorite/{userId}
```

### GET /api/posts 응답 변경

기존에는 배열을 직접 반환했다.

```json
[
  {
    "id": "postId"
  }
]
```

변경 후에는 페이지 메타데이터를 포함한 객체를 반환한다.

```json
{
  "items": [
    {
      "id": "postId",
      "favoriteCount": 12,
      "isFavorite": true,
      "isParticipant": false,
      "isOwner": false,
      "thumbnailUrl": "https://example.com/image.jpg",
      "deadlineStatus": "closingSoon",
      "deadlineLabel": "오늘 마감",
      "remainingSeconds": 3600
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "hasNext": true
}
```

### GET /api/posts/{id} 응답 추가 필드

상세 응답에 다음 필드를 추가했다.

```text
isOwner
thumbnailUrl
participantsPreview
participantsTotal
deadlineStatus
deadlineLabel
remainingSeconds
```

기존 `author`, `participants`, `favoriteCount`, `isFavorite`, `isParticipant`는 유지한다.

### 참여/참여취소 응답 변경

참여 후 프론트가 진행률을 즉시 갱신할 수 있도록 최소 게시글 스냅샷을 반환한다.

```json
{
  "isParticipant": true,
  "post": {
    "id": "postId",
    "currentQuantity": 2,
    "minParticipants": 3,
    "status": "open"
  }
}
```

참여 취소는 `isParticipant`가 `false`로 내려간다.

### 찜 등록/해제 응답 변경

카드와 상세의 하트 상태 및 관심 수를 즉시 갱신할 수 있도록 최신 카운트를 반환한다.

```json
{
  "isFavorite": true,
  "favoriteCount": 13
}
```

찜 해제는 `isFavorite`가 `false`로 내려간다.

### 정렬 기준 변경

`sort=deadline`은 마감 전 게시글을 먼저 보여준 뒤 `deadline ASC`, `createdAt DESC` 순서로 정렬한다.

`sort=popular` 기준을 프론트 요구에 맞춰 다음 순서로 확정했다.

```text
currentQuantity DESC
favoriteCount DESC
createdAt DESC
```

### 검색 기준 보강

`keyword`/`q` 검색은 기존 `title`, `content`, `pickupLocation`에 더해 카테고리 ID와 주요 한글 라벨도 매칭한다.

### 프론트엔드 영향

`GET /api/posts`는 배열에서 객체로 바뀌므로 프론트엔드에서 `response.items`를 사용해야 한다. 카드 UI는 `thumbnailUrl`, `isFavorite`, `isParticipant`, `isOwner`, `deadlineStatus`, `deadlineLabel`, `remainingSeconds`를 직접 사용할 수 있다.

### 확인 명령

```bash
curl -s "http://localhost:3000/api/posts?status=open&sort=latest&limit=20&offset=0&userId={userId}"
curl -s "http://localhost:3000/api/posts/{postId}?userId={userId}"
```

## 2026-05-15 - 내 공구 탭 요약 API 추가

브랜치:

```text
feature/participant-status
```

변경 전 기준 커밋:

```text
d7461d0
```

### 변경 요약

내 공구 화면의 세 탭 상단 카운트를 프론트엔드가 목록 전체를 내려받아 직접 세지 않아도 되도록 요약 API를 추가했다.

### 추가된 API

```text
GET /api/users/{userId}/my-posts/summary
```

쿼리 파라미터:

```text
deadlineSoonHours: 마감임박 기준 시간. 기본값 24
recentDays: 최근 추가 기준 일수. 기본값 7
```

### 응답 예시

```json
{
  "registered": {
    "inProgress": 3,
    "deadlineSoon": 1,
    "completed": 5
  },
  "participated": {
    "participating": 4,
    "paymentPending": 1,
    "pickupReady": 2,
    "received": 6
  },
  "favorites": {
    "total": 8,
    "deadlineSoon": 2,
    "recent": 3
  },
  "meta": {
    "deadlineSoonHours": 24,
    "recentDays": 7
  }
}
```

### 집계 기준

등록한 공구:

```text
inProgress = 작성자가 등록한 active 공구 수(open, closed, in_progress)
deadlineSoon = 작성자가 등록한 모집중(open) 공구 중 현재 시각 이후 deadlineSoonHours 이내 마감
completed = 작성자가 등록한 completed 공구 수
```

참여한 공구:

```text
participating = participantStatus participating
paymentPending = participantStatus payment_pending
pickupReady = participantStatus pickup_ready
received = participantStatus received
```

관심 공구:

```text
total = 찜한 상품 전체 수
deadlineSoon = 찜한 모집중(open) 공구 중 현재 시각 이후 deadlineSoonHours 이내 마감
recent = recentDays 이내 관심 등록 수
```

### 프론트엔드 영향

내 공구 화면 상단 카운트는 다음 값으로 바로 렌더링할 수 있다.

```text
등록한 공구: registered.inProgress, registered.deadlineSoon, registered.completed
참여한 공구: participated.participating, participated.paymentPending, participated.received
관심 공구: favorites.total, favorites.deadlineSoon, favorites.recent
```

`participated.pickupReady`는 카드 배지 또는 추후 상단 지표에 사용할 수 있도록 함께 내려준다.

확인 명령:

```bash
curl -s "http://localhost:3000/api/users/{userId}/my-posts/summary"
curl -s "http://localhost:3000/api/users/{userId}/my-posts/summary?deadlineSoonHours=48&recentDays=3"
```

## 2026-05-14 - 참여자별 진행 상태 API 추가

브랜치:

```text
feature/participant-status
```

변경 전 기준 커밋:

```text
8953132
```

### 변경 요약

내 공구 화면에서 참여자별 진행 상태를 표시하고 변경할 수 있도록 참여 row에 `participantStatus`를 추가했다.

게시글 전체 진행 상태는 기존 `posts.status`를 유지하고, 사용자별 상태는 `post_participants.participant_status`를 기준으로 내려준다.

### Swagger/OpenAPI 스키마 변경

대상 파일:

```text
src/config/swagger.ts
src/routes/posts/PostRoutes.ts
```

추가된 스키마:

```text
components.schemas.ParticipantStatus
components.schemas.PostParticipant
components.schemas.ParticipatedPost
```

변경된 스키마:

```text
components.schemas.PostParticipantProfile
```

추가된 API:

```text
PATCH /api/posts/{id}/participants/{userId}/status
```

변경된 API 응답:

```text
GET /api/posts/{id}
GET /api/posts/{id}/participants
GET /api/posts/user/{userId}/participated
```

### 참여 상태값

```text
participating = 참여중
payment_pending = 입금대기
pickup_ready = 수령예정
received = 수령완료
```

### 신규 API 요청 예시

```json
{
  "participantStatus": "payment_pending",
  "actorUserId": "a87522bd-bc79-47b0-a73f-46ea4068a158"
}
```

`actorUserId`는 `x-user-id` 헤더로도 전달할 수 있다.

권한 기준:

```text
게시글 작성자 또는 해당 참여자 본인만 변경 가능
```

### API 응답 영향

상세 응답의 참여자 목록:

```json
{
  "participants": [
    {
      "id": "7f7b9a5c-0e86-4f93-bd11-31e9bde8a7f2",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "participantStatus": "participating",
      "joinedAt": "2026-05-14T10:00:00.000Z",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "nickname": "참여자 1",
        "studentId": "20241234",
        "department": "컴퓨터공학과",
        "avatarUrl": null,
        "trustGrade": 4.1
      }
    }
  ]
}
```

내 참여 공구 응답:

```json
{
  "id": "7f7b9a5c-0e86-4f93-bd11-31e9bde8a7f2",
  "postId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
  "participantStatus": "payment_pending",
  "post": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "물티슈 공동구매",
    "price": 5900,
    "minParticipants": 3,
    "status": "open",
    "deadline": "2026-06-17T23:59:59.000Z"
  }
}
```

### 프론트엔드 영향

내 공구 화면의 참여 공구 탭은 `participantStatus`로 배지를 분기한다.

```text
participating -> 참여중
payment_pending -> 입금대기
pickup_ready -> 수령예정
received -> 수령완료
```

상태 변경 버튼은 다음 API를 호출한다.

```bash
curl -X PATCH "http://localhost:3000/api/posts/{postId}/participants/{userId}/status" \
  -H "Content-Type: application/json" \
  -d '{"participantStatus":"payment_pending","actorUserId":"{actorUserId}"}'
```

확인 명령:

```bash
curl -s "http://localhost:3000/api/posts/{postId}?userId={userId}"
curl -s "http://localhost:3000/api/posts/{postId}/participants"
curl -s "http://localhost:3000/api/posts/user/{userId}/participated"
curl -s "http://localhost:3000/api-docs.json"
```

## 2026-05-14 - 게시글 상세 응답에 작성자/참여자 프로필 추가

브랜치:

```text
feature/post-detail-profiles
```

변경 전 기준 커밋:

```text
19bbe6d
```

### 변경 요약

공구 상세 화면에서 게시글 본문, 작성자 프로필, 참여자 프로필, 관심/참여 상태를 한 번에 렌더링할 수 있도록 `GET /api/posts/{id}` 응답을 상세 화면용 스키마로 확장했다.

### Swagger/OpenAPI 스키마 변경

대상 파일:

```text
src/config/swagger.ts
src/routes/posts/PostRoutes.ts
```

추가된 스키마:

```text
components.schemas.PublicUserProfile
components.schemas.PostParticipantProfile
components.schemas.PostDetail
```

변경된 API:

```text
GET /api/posts/{id}
```

변경 전 응답 스키마:

```text
Post
```

변경 후 응답 스키마:

```text
PostDetail
```

### API 응답 영향

기존 상세 응답 필드는 유지하면서 다음 필드를 추가한다.

```json
{
  "author": {
    "id": "a87522bd-bc79-47b0-a73f-46ea4068a158",
    "nickname": "다마라 공식",
    "studentId": "20241234",
    "department": "생활용품 판매자",
    "avatarUrl": "https://example.com/avatar.jpg",
    "trustGrade": 4.3
  },
  "participants": [
    {
      "id": "7f7b9a5c-0e86-4f93-bd11-31e9bde8a7f2",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "joinedAt": "2026-05-14T10:00:00.000Z",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "nickname": "참여자 1",
        "studentId": "20241234",
        "department": "컴퓨터공학과",
        "avatarUrl": null,
        "trustGrade": 4.1
      }
    }
  ],
  "participantCount": 1,
  "isParticipant": false
}
```

보안/노출 기준:

```text
passwordHash, email은 상세 프로필에 포함하지 않는다.
trustScore는 내부 정책 점수이므로 상세 프로필에는 포함하지 않고 trustGrade만 노출한다.
```

### 프론트엔드 영향

상세 화면에서 별도 사용자 조회 API를 추가 호출하지 않고 다음 영역을 렌더링할 수 있다.

```text
주최자/판매자 프로필: author
참여자 프로필 목록: participants
참여 버튼 상태: isParticipant
관심 버튼 상태: isFavorite
참여자 수 표시: currentQuantity 또는 participantCount
```

사용자별 하트/참여 상태가 필요하면 기존과 동일하게 `x-user-id` 헤더 또는 `userId` 쿼리를 전달한다.

확인 명령:

```bash
curl -s "http://localhost:3000/api/posts/{postId}?userId={userId}"
curl -s "http://localhost:3000/api-docs.json"
```

## 2026-05-13 - OpenAPI 스냅샷, lint, diff 도구 추가

브랜치:

```text
feature/api-docs-tooling
```

변경 전 기준 커밋:

```text
7a8eeb8
```

### 변경 요약

Swagger UI와 `/api-docs.json`은 그대로 유지하면서, API 계약 변경을 파일과 CLI로 추적할 수 있도록 OpenAPI 도구 체계를 추가했다.

### 추가 파일

```text
docs/openapi/openapi.json
docs/api/OPENAPI_TOOLING.md
.spectral.yaml
scripts/export-openapi.ts
```

### 추가 npm script

```text
openapi:generate
openapi:lint
openapi:diff
openapi:diff:breaking
```

### Swagger/OpenAPI 스키마 정리

Spectral의 OpenAPI 기본 검사를 통과하도록 기존 Swagger 설정의 유효성 오류를 정리했다.

```text
info.contact.studentId -> info.contact.x-student-id
Favorite.post의 $ref sibling 제거
전역 tags 정의 추가
```

### API 계약 영향

요청 path, query, body, status code, 응답 필드는 바뀌지 않았다.

이번 변경은 API 문서를 생성, 검사, 비교하는 운영 방식 변경이다.

### 검증 명령

```bash
npm run openapi:generate
npm run openapi:lint
npm run openapi:diff:breaking -- docs/openapi/openapi.json docs/openapi/openapi.json
```

## 2026-05-09 - 신뢰학점 스키마 반영

브랜치:

```text
feature/trust-safety-filtering
```

변경 전 기준 커밋:

```text
7e9f230
```

### 변경 요약

신뢰도 기능을 기존 `trustScore` 단일 값에서 내부 점수와 사용자 표시 학점으로 분리했다.

기존에는 Swagger의 `User` 스키마가 다음 개념만 표현했다.

```text
trustScore
= 사용자 신뢰점수
= 0~100
= 기본값 50
```

이번 변경 후에는 다음처럼 나뉜다.

```text
trustScore
= 백엔드 내부 정책 계산용 점수
= 0~100
= 기본값 50

trustGrade
= 사용자에게 보여주는 신뢰학점
= 2.5~4.5
= 기본값 3.5
```

### Swagger 스키마 변경

대상 파일:

```text
src/config/swagger.ts
```

변경된 스키마:

```text
components.schemas.User
```

변경 전 `required`:

```json
["id", "email", "nickname", "studentId", "trustScore"]
```

변경 후 `required`:

```json
["id", "email", "nickname", "studentId", "trustScore", "trustGrade"]
```

변경 전 `trustScore` 설명:

```text
신뢰점수 (0~100, 기본값: 50)
```

변경 후 `trustScore` 설명:

```text
내부 신뢰점수 (0~100, 기본값: 50)
```

추가된 필드:

```json
{
  "trustGrade": {
    "type": "number",
    "format": "float",
    "description": "사용자에게 표시하는 신뢰학점 (2.5~4.5, 기본값: 3.5)",
    "minimum": 2.5,
    "maximum": 4.5,
    "example": 3.5
  }
}
```

### API 응답 영향

`User` 스키마를 참조하는 응답에서 `trustGrade`가 함께 내려간다.

대표 영향 범위:

```text
POST /api/users
POST /api/users/login
GET /api/users
GET /api/users/{id}
PUT /api/users/{id}
OAuth 로그인/세션 사용자 응답
```

응답 예시는 다음 형태를 기준으로 한다.

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@mju.ac.kr",
  "nickname": "홍길동",
  "studentId": "20241234",
  "trustScore": 50,
  "trustGrade": 3.5
}
```

### 프론트엔드 영향

프론트엔드는 사용자에게 `trustScore`를 직접 보여주기보다 `trustGrade`를 표시하는 것이 맞다.

권장 표시:

```text
신뢰학점: 3.5
```

내부 관리나 정책 판단이 필요한 화면이 아니라면 `trustScore`는 숨긴다.

### 당시 변경되지 않은 것

이 시점의 변경에서는 Swagger에 신규 엔드포인트를 추가하지 않았다.

`trust_events` 테이블과 `TrustService`는 백엔드 내부 정책 이력 저장용으로 추가되었지만, 아직 다음 API는 만들지 않았다.

```text
GET /api/users/{id}/trust-events
PATCH /api/admin/users/{id}/trust-score
POST /api/posts/{id}/participants/{userId}/no-show
```

이 API들이 추가되면 이 문서에 별도 항목으로 기록한다.

## 2026-05-09 - 신뢰 이벤트 조회 API 추가

브랜치:

```text
feature/trust-safety-filtering
```

### 변경 요약

사용자 신뢰학점이 왜 바뀌었는지 확인할 수 있도록 신뢰 이벤트 조회 API를 추가했다.

신규 API:

```text
GET /api/users/{id}/trust-events
```

### 요청

Path parameter:

```text
id: 사용자 UUID
```

Query parameter:

```text
limit: 조회 개수, 기본값 20
offset: 시작 위치, 기본값 0
```

예시:

```bash
curl -s "https://damara.bluerack.org/api/users/{id}/trust-events?limit=20&offset=0"
```

### 응답

응답 형태:

```json
{
  "trustEvents": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
      "postId": "123e4567-e89b-12d3-a456-426614174000",
      "actorUserId": "a87522bd-bc79-47b0-a73f-46ea4068a158",
      "type": "post_completed_author",
      "scoreChange": 10,
      "previousScore": 50,
      "nextScore": 60,
      "previousGrade": 3.5,
      "nextGrade": 3.7,
      "reason": "공동구매 거래 완료: 작성자 보상",
      "metadata": null,
      "createdAt": "2026-05-09T00:00:00.000Z",
      "updatedAt": "2026-05-09T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### Swagger 스키마 변경

추가된 스키마:

```text
components.schemas.TrustEvent
```

주요 필드:

```text
scoreChange
previousScore
nextScore
previousGrade
nextGrade
reason
type
```

`previousScore`와 `nextScore`는 백엔드 내부 정책 점수다.

`previousGrade`와 `nextGrade`는 프론트엔드 화면에 표시하기 쉬운 신뢰학점 값이다.

### 프론트엔드 영향

마이페이지나 관리자 화면에서 “왜 이 사용자의 신뢰학점이 바뀌었는지”를 보여줄 수 있다.

사용자-facing 화면에서는 다음 필드를 우선 사용한다.

```text
previousGrade
nextGrade
reason
createdAt
```

`previousScore`, `nextScore`, `scoreChange`는 정책 확인이나 관리자용 화면에서만 노출하는 것을 권장한다.

### 확인 방법

로컬에서 빌드 확인:

```bash
npm run build
```

배포 후 Swagger JSON 확인:

```bash
curl -s https://damara.bluerack.org/api-docs.json | grep -A20 '"User"'
curl -s https://damara.bluerack.org/api-docs.json | grep -A20 '"TrustEvent"'
```

`servers` 값 확인:

```bash
curl -s https://damara.bluerack.org/api-docs.json | grep -A8 '"servers"'
```

정상 배포 상태에서는 `servers`에 HTTPS 서버가 잡혀야 한다.

```json
[
  {
    "url": "https://damara.bluerack.org",
    "description": "Current server (자동 감지)"
  }
]
```

## 다음 변경 시 기록할 후보

앞으로 신뢰/보안 기능이 확장되면 Swagger 변경 이력에 다음 항목을 추가한다.

```text
사전 약속 확인 API
노쇼 신고 API
관리자 신뢰도 수동 조정 API
학교 인증 단계 API
신뢰학점 기반 참여 제한/필터링 API
```
