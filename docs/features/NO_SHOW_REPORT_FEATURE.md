# 노쇼 신고/확정 API 개발 보고서

## 1. 작업 시점

```text
2026-05-11
브랜치: feature/participant-agreement
관련 커밋: 미커밋
```

## 2. 문제 배경

```text
기존 문제:
참여자가 사전 약속을 확인한 뒤 실제 거래에 오지 않는 상황을 기록할 구조가 없었다.

사용자/운영자/프론트엔드 관점의 불편:
노쇼를 바로 감점하면 악용 가능성이 있고, 감점을 하지 않으면 신뢰학점의 근거가 약해진다.

이번 작업으로 해결하려는 것:
노쇼 신고와 확정을 분리해 신고 이력을 먼저 남기고, 확정 시에만 신뢰학점을 낮춘다.
```

## 3. 기획 방향

```text
선택한 방향:
no_show_reports 테이블을 추가하고 pending -> confirmed/rejected 흐름으로 처리한다.
confirmed 처리 시에만 trust_events.participant_no_show 이벤트를 기록한다.

선택하지 않은 대안:
신고 생성 즉시 감점하는 방식은 선택하지 않았다.

선택 이유:
노쇼 신고는 이해관계가 민감하므로 확정 단계를 둬야 악용 가능성을 줄일 수 있다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
participant_no_show 이벤트 타입과 정책 상수는 있었지만 실제 신고 API와 테이블은 없었다.

변경 후 구현:
POST /api/posts/{postId}/no-show-reports로 신고를 생성한다.
PATCH /api/no-show-reports/{id}/confirm으로 확정한다.
PATCH /api/no-show-reports/{id}/reject로 반려한다.
PATCH /api/no-show-reports/{id}/cancel로 pending 신고를 취소한다.
확정 시 신뢰학점이 약 0.3 하락하도록 내부 점수를 -15 변경한다.

호환성:
기존 신뢰 이벤트 조회 API는 그대로 사용한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/models/NoShowReport.ts
src/repos/NoShowReportRepo.ts
src/services/NoShowReportService.ts
src/controllers/no-show-report.controller.ts
src/routes/no-show-reports/NoShowReportRoutes.ts
src/routes/posts/PostRoutes.ts
src/services/TrustService.ts
src/services/PostService.ts
src/config/swagger.ts

핵심 로직:
신고 생성은 게시글 작성자만 가능하다.
신고 대상은 사전 약속 확인이 완료된 accepted 참여자여야 한다.
같은 게시글/대상 사용자에 열린 신고가 있으면 중복 신고를 막는다.
확정 시 participant_no_show 신뢰 이벤트를 기록하고 내부 신뢰점수를 -15 낮춘다.
내부 점수 -15는 표시 신뢰학점 약 -0.3에 해당한다.

새로 추가된 모델/서비스/라우트:
NoShowReport
NoShowReportService
POST /api/posts/{postId}/no-show-reports
GET /api/posts/{postId}/no-show-reports
GET /api/no-show-reports/{id}
PATCH /api/no-show-reports/{id}/confirm
PATCH /api/no-show-reports/{id}/reject
PATCH /api/no-show-reports/{id}/cancel
GET /api/posts/{id}/participation-eligibility/{userId}
```

## 6. API/Swagger 영향

```text
변경 여부: 있음

영향 API:
POST /api/posts/{postId}/no-show-reports
GET /api/posts/{postId}/no-show-reports
GET /api/no-show-reports/{id}
PATCH /api/no-show-reports/{id}/confirm
PATCH /api/no-show-reports/{id}/reject
PATCH /api/no-show-reports/{id}/cancel
GET /api/posts/{id}/participation-eligibility/{userId}
POST /api/posts/{id}/participate

요청 변경:
노쇼 신고 생성은 reporterId, reportedUserId, reason을 받는다.

응답 변경:
NoShowReport 스키마가 추가됐다.
노쇼 확정 응답에는 report와 trustEvent가 포함된다.
참여 가능 여부 조회는 trustGrade, canParticipate, restrictionLevel을 반환한다.
노쇼 확정/반려와 관리자 취소는 ADMIN_USER_IDS 기반 관리자 권한 검증을 요구한다.

프론트엔드 수정 필요 여부:
있음. 노쇼 신고/확정 화면과 낮은 신뢰학점 사용자의 참여 제한 상태 표시가 필요하다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음

신규 테이블:
no_show_reports

신규 컬럼:
없음

변경된 관계:
posts 1:N no_show_reports
users 1:N no_show_reports(reporter_id)
users 1:N no_show_reports(reported_user_id)

마이그레이션 필요 여부:
있음. 운영 DB에서는 no_show_reports 테이블을 migration으로 생성해야 한다.

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
NoShowReport.status
NoShowReport.reason
NoShowReport.resolvedAt
trustEvent.previousGrade
trustEvent.nextGrade
restrictionLevel

숨겨야 할 필드:
trustScore는 일반 사용자 화면에서 직접 노출하지 않는 것을 권장한다.

요청 payload 변경:
노쇼 신고 생성 시 reporterId, reportedUserId, reason을 전송한다.

호출 URL 변경:
POST /api/posts/{postId}/no-show-reports
PATCH /api/no-show-reports/{id}/confirm
PATCH /api/no-show-reports/{id}/reject
PATCH /api/no-show-reports/{id}/cancel
GET /api/posts/{id}/participation-eligibility/{userId}

주의할 상태값:
pending
confirmed
rejected
cancelled
normal
warning
extra_agreement_required
blocked
```

## 9. 검증 방법

```bash
npm run build
```

API 확인 예시:

```bash
curl -X POST "http://localhost:3000/api/posts/{postId}/no-show-reports" \
  -H "Content-Type: application/json" \
  -d '{"reporterId":"{authorId}","reportedUserId":"{participantUserId}","reason":"약속 장소에 오지 않았습니다."}'

curl -X PATCH "http://localhost:3000/api/no-show-reports/{reportId}/confirm"
curl -X PATCH "http://localhost:3000/api/no-show-reports/{reportId}/cancel" \
  -H "Content-Type: application/json" \
  -d '{"requesterId":"{authorId}"}'
curl -s "http://localhost:3000/api/posts/{postId}/participation-eligibility/{userId}"
```

## 10. 남은 작업

```text
후속 API:
관리자 목록 관리 API
노쇼 신고 첨부 이미지

운영/배포 주의점:
운영 DB에는 no_show_reports 테이블과 post_participants 신규 컬럼을 migration으로 반영하는 것이 안전하다.
노쇼 확정/반려 관리자 검증을 사용하려면 서버 환경변수 ADMIN_USER_IDS에 관리자 사용자 UUID를 쉼표로 구분해 설정해야 한다.

테스트 보강:
노쇼 신고 생성 조건, 중복 신고 방지, 확정 idempotency, 반려/취소 상태 전이, 관리자 권한 검증, 신뢰학점 -0.3 하락 검증이 필요하다.

문서 보강:
프론트엔드 화면 정책이 확정되면 status별 문구와 버튼 노출 조건을 추가한다.
```
