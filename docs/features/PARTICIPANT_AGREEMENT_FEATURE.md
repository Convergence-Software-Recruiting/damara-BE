# 사전 약속 확인 API 개발 보고서

## 1. 작업 시점

```text
2026-05-11
브랜치: feature/participant-agreement
관련 커밋: 미커밋
```

## 2. 문제 배경

```text
기존 문제:
공동구매 참여 row만으로는 참여자가 거래 전 조건을 확인했는지 알 수 없었다.

사용자/운영자/프론트엔드 관점의 불편:
노쇼나 거래 분쟁이 생겼을 때 참여자가 약속 조건을 확인했는지 판단할 근거가 부족했다.

이번 작업으로 해결하려는 것:
참여 신청과 약속 확인을 분리하고, 확인 완료 시각을 남겨 이후 노쇼 신고/확정 정책의 근거 데이터로 사용한다.
```

## 3. 기획 방향

```text
선택한 방향:
post_participants에 agreement_status와 agreement_accepted_at을 추가한다.
참여 신청은 pending으로 시작하고, 별도 PATCH API로 accepted 상태가 된다.

선택하지 않은 대안:
참여 신청 API 요청 바디에 약속 확인 여부를 함께 받는 방식은 선택하지 않았다.

선택 이유:
참여 신청과 약속 확인은 프론트엔드 UX에서 별도 액션으로 표현하기 쉽고, 분쟁 이력에서도 구분해 추적하는 편이 안전하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
POST /api/posts/{id}/participate 호출 시 post_participants row가 생성되고 currentQuantity가 즉시 증가했다.

변경 후 구현:
POST /api/posts/{id}/participate 호출 시 agreementStatus=pending row가 생성된다.
PATCH /api/posts/{postId}/participants/{userId}/agreement 호출 시 accepted로 변경되고 currentQuantity가 증가한다.

호환성:
기존 참여 API는 유지된다. 다만 currentQuantity 의미가 전체 참여 row 수에서 약속 확인 완료 참여자 수로 바뀐다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/models/PostParticipant.ts
src/repos/PostParticipantRepo.ts
src/services/PostService.ts
src/services/TrustService.ts
src/controllers/post.controller.ts
src/routes/posts/PostRoutes.ts
src/config/swagger.ts

핵심 로직:
참여자는 pending 상태로 생성된다.
약속 확인 API는 pending을 accepted로 바꾸고 agreementAcceptedAt을 기록한다.
currentQuantity는 agreementStatus=accepted인 참여자 수로 동기화한다.
pending 상태에서 참여 취소하면 신뢰점수를 변경하지 않고, accepted 취소에만 기존 참여 취소 감점을 적용한다.
중복 약속 확인 호출은 idempotent하게 처리하고 신뢰 이벤트를 중복 기록하지 않는다.

새로 추가된 모델/서비스/라우트:
PostParticipant.agreementStatus
PostParticipant.agreementAcceptedAt
PostParticipantService.confirmAgreement
PATCH /api/posts/{postId}/participants/{userId}/agreement
```

## 6. API/Swagger 영향

```text
변경 여부: 있음

영향 API:
POST /api/posts/{id}/participate
GET /api/posts/{id}/participants
PATCH /api/posts/{postId}/participants/{userId}/agreement

요청 변경:
신규 PATCH API는 요청 바디가 없다.

응답 변경:
participant 응답에 agreementStatus, agreementAcceptedAt이 추가된다.
Post.currentQuantity는 약속 확인 완료 참여자 수로 해석한다.

프론트엔드 수정 필요 여부:
있음. 참여 신청 후 약속 확인 버튼에서 신규 PATCH API를 호출해야 한다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음

신규 테이블:
없음

신규 컬럼:
post_participants.agreement_status
post_participants.agreement_accepted_at

변경된 관계:
없음

마이그레이션 필요 여부:
있음. 운영 DB에서는 명시적인 ALTER TABLE 또는 migration 반영이 필요하다.

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
agreementStatus
agreementAcceptedAt

숨겨야 할 필드:
없음

요청 payload 변경:
신규 약속 확인 API는 바디 없이 호출한다.

호출 URL 변경:
PATCH /api/posts/{postId}/participants/{userId}/agreement

주의할 상태값:
pending = 약속 확인 필요
accepted = 참여 확정
```

## 9. 검증 방법

```bash
npm run build
```

API 확인 예시:

```bash
curl -X PATCH "http://localhost:3000/api/posts/{postId}/participants/{userId}/agreement"
curl -s http://localhost:3000/api-docs.json | grep -A40 "PostParticipant"
```

## 10. 남은 작업

```text
후속 API:
노쇼 신고 첨부 이미지
관리자 목록 관리 API

운영/배포 주의점:
운영 DB에는 post_participants 신규 컬럼을 migration으로 반영하는 것이 안전하다.

테스트 보강:
참여 신청 pending 생성, 약속 확인 accepted 전환, 중복 호출 idempotency, currentQuantity 동기화 테스트가 필요하다.

문서 보강:
프론트엔드 연동 후 실제 화면 플로우 기준으로 예시를 추가한다.
```
