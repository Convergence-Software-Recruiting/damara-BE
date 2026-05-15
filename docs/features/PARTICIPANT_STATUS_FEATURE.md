# 참여자별 진행 상태 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-14
브랜치: feature/participant-status
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
게시글 전체 상태(posts.status)는 있었지만, 참여자 한 명이 입금대기인지 수령예정인지 수령완료인지 구분할 수 없었다.

사용자/운영자/프론트엔드 관점의 불편:
내 공구 화면에서 참여중, 입금대기, 수령예정, 수령완료 배지를 안정적으로 표시할 API 필드가 없었다.

이번 작업으로 해결하려는 것:
참여 row 자체에 participantStatus를 저장하고, 상세/참여자 목록/내 참여 공구 응답에서 같은 상태값을 내려준다.
```

## 3. 기획 방향

```text
선택한 방향:
post_participants.participant_status를 추가해 사용자별 참여 상태를 관리한다.

선택하지 않은 대안:
posts.status에 참여중, 입금대기, 수령완료 같은 상태를 추가하지 않는다.

선택 이유:
posts.status는 공동구매 게시글 전체 상태이고, 입금/수령 상태는 참여자마다 다르게 변할 수 있기 때문이다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
post_participants는 postId, userId만 저장하고 참여 여부만 표현했다.

변경 후 구현:
post_participants가 participantStatus를 저장한다.
참여 생성 시 기본값은 participating이다.
작성자 또는 해당 참여자 본인은 PATCH API로 상태를 변경할 수 있다.

호환성:
기존 참여 생성/취소 API path는 유지된다.
기존 응답 필드는 유지하고 participantStatus만 추가한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/participant-status.ts
src/models/PostParticipant.ts
src/repos/PostParticipantRepo.ts
src/services/PostService.ts
src/controllers/post.controller.ts
src/routes/common/validation/participant-status-schemas.ts
src/routes/posts/PostRoutes.ts
src/config/swagger.ts
src/app.ts

핵심 로직:
ParticipantStatus enum 타입과 라벨을 정의한다.
PostParticipant 모델에 participantStatus 컬럼을 추가한다.
PostParticipantRepo.updateStatus가 참여 row 상태를 변경한다.
PostParticipantService.updateParticipantStatus가 작성자/본인 권한을 확인한다.
syncDatabase가 participant_status 컬럼을 별도로 확인해 개발 환경 자동 반영 실패를 보강한다.
브라우저에서 x-user-id 헤더를 사용할 수 있도록 CORS 허용 헤더에 X-User-Id를 포함한다.

새로 추가된 모델/서비스/라우트:
PATCH /api/posts/{id}/participants/{userId}/status
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/posts/{id}
GET /api/posts/{id}/participants
GET /api/posts/user/{userId}/participated
PATCH /api/posts/{id}/participants/{userId}/status

요청 변경:
PATCH 상태 변경 요청 body에 participantStatus와 선택 actorUserId를 사용한다.
actorUserId는 x-user-id 헤더로도 전달할 수 있다.

응답 변경:
참여 row 또는 상세 participants 항목에 participantStatus가 추가된다.

프론트엔드 수정 필요 여부:
내 공구 화면 참여 상태 배지는 participantStatus를 기준으로 표시한다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

상태값:

```text
participating = 참여중
payment_pending = 입금대기
pickup_ready = 수령예정
received = 수령완료
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: 없음
신규 컬럼: post_participants.participant_status
변경된 관계: 없음
마이그레이션 필요 여부: 운영 DB에는 ALTER TABLE 적용 권장
ERD 변경 이력 문서: docs/architecture/ERD_CHANGELOG.md
```

운영 반영용 SQL:

```sql
ALTER TABLE post_participants
  ADD COLUMN participant_status ENUM(
    'participating',
    'payment_pending',
    'pickup_ready',
    'received'
  ) NOT NULL DEFAULT 'participating';
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
participantStatus

숨겨야 할 필드:
없음

요청 payload 변경:
PATCH /api/posts/{id}/participants/{userId}/status
{
  "participantStatus": "payment_pending",
  "actorUserId": "{현재 사용자 UUID}"
}

호출 URL 변경:
기존 조회 URL은 유지된다.
상태 변경 URL만 신규 추가된다.

주의할 상태값:
participating, payment_pending, pickup_ready, received
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
npm run openapi:diff:breaking -- /tmp/damara-openapi-main.json docs/openapi/openapi.json
```

API 확인 예시:

```bash
curl -s "http://localhost:3000/api/posts/{postId}?userId={userId}"
curl -s "http://localhost:3000/api/posts/{postId}/participants"
curl -s "http://localhost:3000/api/posts/user/{userId}/participated"
curl -X PATCH "http://localhost:3000/api/posts/{postId}/participants/{userId}/status" \
  -H "Content-Type: application/json" \
  -d '{"participantStatus":"payment_pending","actorUserId":"{actorUserId}"}'
```

## 10. 남은 작업

```text
후속 API:
상태 전이 규칙을 더 엄격히 제한해야 하면 별도 정책을 추가한다.

운영/배포 주의점:
운영 DB에는 participant_status 컬럼이 먼저 추가되어야 한다.
개발 환경에서는 서버 시작 시 컬럼 보강 로직이 동작한다.

테스트 보강:
작성자 변경, 참여자 본인 변경, 권한 없는 사용자 403 케이스를 자동화한다.

문서 보강:
프론트 구현 후 실제 화면의 버튼 액션과 상태 전이표를 맞춘다.
```
