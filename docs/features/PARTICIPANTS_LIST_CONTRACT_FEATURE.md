# 참여자 목록 응답 계약 보강 보고서

## 1. 작업 시점

```text
2026-05-20
브랜치: feature/participants-list-contract
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
GET /api/posts/{id}/participants가 참여 row 배열을 그대로 반환해 상세 화면의 참여자 카드에 필요한 공개 프로필, 신뢰학점, 상태 라벨, 페이지네이션 메타가 부족했다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드는 참여자 목록을 그리기 위해 사용자 프로필 API를 추가 호출하거나 상태 라벨을 자체 매핑해야 했다.

이번 작업으로 해결하려는 것:
공구 상세 화면에서 참여자 목록을 한 번의 API 호출로 렌더링할 수 있게 한다.
```

## 3. 기획 방향

```text
선택한 방향:
기존 참여자 목록 API를 유지하되 응답을 { participants, total, limit, offset, hasNext } 형태로 래핑하고 각 참여자 항목에 공개 프로필 필드를 포함한다.

선택하지 않은 대안:
별도 /participants/profiles API를 새로 추가하지 않았다.

선택 이유:
화면이 이미 게시글 기준 참여자 목록을 조회하므로 기존 path를 유지하는 편이 프론트엔드 호출 흐름과 Swagger 탐색성이 좋다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/posts/{id}/participants는 PostParticipant 배열을 반환했다.

변경 후 구현:
응답 최상위에 participants, total, limit, offset, hasNext를 포함한다.
participants[] 항목에는 nickname, studentId, department, avatarUrl, trustGrade, joinedAt, status, participantStatus, participantStatusLabel을 포함한다.

호환성:
응답 최상위 구조가 배열에서 객체로 바뀌므로 프론트엔드는 participants 배열을 읽도록 수정해야 한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/repos/PostParticipantRepo.ts
src/services/PostService.ts
src/controllers/post.controller.ts
src/routes/posts/PostRoutes.ts
src/config/swagger.ts

핵심 로직:
PostParticipantRepo.findByPostId가 limit/offset을 선택적으로 받고 사용자 공개 프로필 필드를 함께 조회한다.
PostParticipantService.getParticipants가 참여자 항목을 화면 계약에 맞게 매핑하고 페이지네이션 메타를 반환한다.

새로 추가된 모델/서비스/라우트:
신규 라우트는 없고 기존 GET /api/posts/{id}/participants 계약을 보강했다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: GET /api/posts/{id}/participants
요청 변경: limit, offset 선택 쿼리 추가
응답 변경: 배열 응답에서 페이지네이션 객체 응답으로 변경
프론트엔드 수정 필요 여부: 있음. response.participants를 사용해야 한다.
Swagger 변경 이력 문서: docs/api/SWAGGER_CHANGELOG.md
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
participants[].nickname
participants[].avatarUrl
participants[].trustGrade
participants[].participantStatusLabel
participants[].joinedAt
total
hasNext

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
없음. 필요 시 ?limit=20&offset=0을 붙인다.

주의할 상태값:
status는 참여자 목록 표시용 joined 고정값이다.
participantStatus는 participating, payment_pending, pickup_ready, received 중 하나다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
curl -s "http://localhost:3000/api/posts/{postId}/participants?limit=20&offset=0"
```

## 10. 남은 작업

```text
후속 API:
상세 화면에서 참여자 검색 또는 상태별 필터가 필요해지면 쿼리 파라미터를 추가한다.

운영/배포 주의점:
프론트엔드가 기존 배열 응답을 기대하면 수정이 필요하다.

테스트 보강:
참여자 목록 응답 shape와 pagination meta를 검증하는 API 테스트를 추가할 수 있다.

문서 보강:
프론트엔드 연동 예시가 확정되면 docs/features 문서에 UI별 필드 매핑 표를 추가한다.
```
