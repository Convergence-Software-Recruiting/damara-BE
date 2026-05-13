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
http://be.damara.bluerack.org/api-docs.json
```

## 2026-05-12 - 홈 피드 목록 API 확장

브랜치:

```text
feature/home-feed-api
```

변경 전 기준 커밋:

```text
7a8eeb8
```

### 변경 요약

프론트엔드 메인 홈 화면이 배너, 인기 공동구매 카드, 정렬 탭, 검색, 필터 중심으로 변경되어 기존 게시글 목록 API를 홈 피드용으로 확장했다.

새 엔드포인트를 만들지 않고 기존 목록 API를 유지해 다음 화면 영역을 같은 계약으로 처리한다.

```text
GET /api/posts
```

### 추가 쿼리 파라미터

```text
sort: latest | deadline | popular
status: open | closed | in_progress | completed | cancelled
keyword: 제목/내용/픽업 장소 검색어
q: keyword와 같은 의미의 검색어 alias
userId: isFavorite 계산용 현재 사용자 UUID
x-user-id header: userId와 같은 의미의 현재 사용자 UUID
```

기존 쿼리는 그대로 유지한다.

```text
limit
offset
category
```

### 응답 변경

`GET /api/posts` 목록 응답의 각 게시글에 상세 조회와 동일하게 다음 필드가 포함된다.

```text
favoriteCount
isFavorite
```

기존 배열 응답 형식은 유지하므로 기존 클라이언트의 파싱 구조는 바뀌지 않는다.

### 프론트엔드 호출 기준

홈 상단 인기 카드:

```text
GET /api/posts?sort=popular&status=open&limit=6
```

최신순 탭:

```text
GET /api/posts?sort=latest&status=open&limit=20&offset=0
```

마감임박순 탭:

```text
GET /api/posts?sort=deadline&status=open&limit=20&offset=0
```

카테고리 필터:

```text
GET /api/posts?category=daily&sort=latest&status=open
```

검색:

```text
GET /api/posts?keyword=물티슈&status=open
```

로그인 사용자 기준 하트 표시가 필요하면 `x-user-id` 헤더 또는 `userId` 쿼리를 함께 전달한다.

### Swagger 변경

```text
src/routes/posts/PostRoutes.ts
```

`GET /api/posts` Swagger에 홈 피드용 쿼리 파라미터와 응답 설명을 추가했다.

### DB/ERD 영향

DB 테이블, 컬럼, enum, 관계 변경은 없다.

### 배포 후 확인

```bash
curl -s "http://be.damara.bluerack.org/api/posts?sort=popular&status=open&limit=6" | head
curl -s "http://be.damara.bluerack.org/api-docs.json" | head
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
curl -s "http://be.damara.bluerack.org/api/users/{id}/trust-events?limit=20&offset=0"
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
curl -s http://be.damara.bluerack.org/api-docs.json | grep -A20 '"User"'
curl -s http://be.damara.bluerack.org/api-docs.json | grep -A20 '"TrustEvent"'
```

`servers` 값 확인:

```bash
curl -s http://be.damara.bluerack.org/api-docs.json | grep -A8 '"servers"'
```

정상 배포 상태에서는 `servers`에 HTTPS 서버가 잡혀야 한다.

```json
[
  {
    "url": "http://be.damara.bluerack.org",
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
