# ERD/DB 변경 이력

이 문서는 테이블, 컬럼, 관계, enum처럼 ERD에 영향을 주는 변경을 기록한다.

프론트엔드 개발자는 주로 API 계약을 보지만, 백엔드 데이터 구조 변경이 응답 필드나 정책 동작에 영향을 줄 수 있으므로 주요 DB 변경도 함께 남긴다.

## 업데이트 원칙

DB 구조가 바뀌면 다음 내용을 기록한다.

1. 변경 날짜와 브랜치
2. 변경 전 기준 커밋
3. 추가/변경/삭제된 테이블
4. 추가/변경/삭제된 컬럼
5. 관계 변경
6. API 응답 영향
7. 배포 시 마이그레이션 주의점

## 2026-05-11 - 노쇼 신고 테이블 추가

브랜치:

```text
feature/participant-agreement
```

변경 전 기준 커밋:

```text
3fd573d
```

### 변경 요약

노쇼는 신고 즉시 감점하면 악용될 수 있으므로 신고와 확정을 분리한다. 이를 위해 `no_show_reports` 테이블을 추가한다.

기존 구조:

```text
trust_events.participant_no_show 타입은 예약되어 있었지만 신고/확정 근거 테이블은 없었다.
```

변경 후 구조:

```text
no_show_reports
= 노쇼 신고, 확정, 반려 상태를 저장

trust_events
= confirmed 처리 시 participant_no_show 감점 이력 저장
```

### 신규 테이블

```text
no_show_reports
```

컬럼:

```text
id
post_id
reporter_id
reported_user_id
status
reason
resolved_at
created_at
updated_at
```

### 관계

```text
posts 1:N no_show_reports
users 1:N no_show_reports(reporter_id)
users 1:N no_show_reports(reported_user_id)
```

의미:

```text
reporter_id
= 신고자. 현재 정책에서는 게시글 작성자만 허용한다.

reported_user_id
= 노쇼 신고 대상 참여자
```

### 상태값

```text
pending
confirmed
rejected
cancelled
```

의미:

```text
pending
= 신고 접수 후 확정/반려 전

confirmed
= 노쇼 확정, 신뢰 이벤트 기록 완료

rejected
= 신고 반려, 신뢰점수 변경 없음

cancelled
= 신고자 또는 관리자가 pending 신고를 취소함
```

### 신뢰학점 영향

노쇼 확정 시 기존 예약 이벤트 타입을 사용한다.

```text
trust_events.type = participant_no_show
score_change = -15
```

현재 신뢰학점 환산식은 내부 점수 1점당 표시 학점 0.02점이다.

```text
-15 * 0.02 = -0.3
```

따라서 노쇼 확정 1회는 사용자 표시 신뢰학점을 약 0.3 낮춘다.

### API 응답 영향

신규 응답 스키마:

```text
NoShowReport
```

참여 제한 조회 응답은 DB 컬럼 추가 없이 `users.trust_score`를 신뢰학점으로 환산해 반환한다.

```text
GET /api/posts/{id}/participation-eligibility/{userId}
```

관리자 권한은 DB 컬럼을 추가하지 않고 서버 환경변수 allowlist로 검증한다.

```text
ADMIN_USER_IDS
```

### 배포 주의점

운영 DB에는 다음 테이블이 필요하다.

```sql
CREATE TABLE no_show_reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  reporter_id CHAR(36) NOT NULL,
  reported_user_id CHAR(36) NOT NULL,
  status ENUM('pending', 'confirmed', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  reason VARCHAR(500) NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

운영 배포에서는 `sequelize.sync({ alter: true })`보다 명시적인 migration으로 반영하는 것이 안전하다.

## 2026-05-11 - 참여자 사전 약속 확인 컬럼 추가

브랜치:

```text
feature/participant-agreement
```

변경 전 기준 커밋:

```text
3fd573d
```

### 변경 요약

공동구매 참여자가 거래 전 약속 조건을 확인했는지 추적하기 위해 `post_participants` 테이블에 약속 확인 상태와 확인 일시를 추가한다.

기존 구조:

```text
post_participants
= post_id와 user_id만으로 참여 여부를 표현
```

변경 후 구조:

```text
post_participants.agreement_status
= 사전 약속 확인 상태

post_participants.agreement_accepted_at
= 약속 확인 완료 시각
```

### 변경 테이블

```text
post_participants
```

신규 컬럼:

```text
agreement_status
agreement_accepted_at
```

컬럼 의미:

```text
agreement_status
= pending 또는 accepted
= 기본값 pending
= null 불가

agreement_accepted_at
= accepted 상태가 된 시각
= pending 상태에서는 null
```

### enum 값

```text
pending
accepted
```

의미:

```text
pending
= 참여 신청은 했지만 거래 전 약속 확인을 아직 완료하지 않음

accepted
= 참여자가 거래 전 약속 조건을 확인함
```

### 관계 변경

관계 추가는 없다.

기존 관계를 유지한다.

```text
posts N:M users through post_participants
```

### API 응답 영향

참여자 응답에 다음 필드가 추가된다.

```text
agreementStatus
agreementAcceptedAt
```

게시글의 `currentQuantity`는 이제 전체 참여 row 수가 아니라 `agreement_status=accepted`인 참여자 수를 의미한다.

참여 취소 정책도 상태값을 기준으로 해석한다. `pending` 취소는 최종 참여 확정 전 취소라서 신뢰점수 감점 대상이 아니고, `accepted` 취소만 기존 `participant_cancelled` 이벤트 대상이다.

### 신뢰 이벤트 영향

기존 `trust_events.type` enum에 예약되어 있던 값을 사용한다.

```text
agreement_confirmed
```

약속 확인 이벤트는 신뢰점수를 바꾸지 않고 이력만 남긴다.

```text
score_change = 0
previous_score = next_score
```

### 배포 주의점

운영 DB에는 다음 컬럼이 필요하다.

```sql
ALTER TABLE post_participants
  ADD COLUMN agreement_status ENUM('pending', 'accepted') NOT NULL DEFAULT 'pending',
  ADD COLUMN agreement_accepted_at DATETIME NULL;
```

현재 서버는 `sequelize.sync({ alter: true })`를 사용하지만, 운영 배포에서는 명시적인 migration으로 반영하는 것이 안전하다.

## 2026-05-09 - 신뢰 이벤트 이력 테이블 추가

브랜치:

```text
feature/trust-safety-filtering
```

변경 전 기준 커밋:

```text
7e9f230
```

### 변경 요약

사용자 신뢰도를 단순 현재값으로만 관리하지 않고, 점수가 왜 바뀌었는지 추적하기 위해 `trust_events` 테이블을 추가한다.

기존 구조:

```text
users.trust_score
= 현재 신뢰점수만 저장
```

변경 후 구조:

```text
users.trust_score
= 현재 내부 신뢰점수 저장

trust_events
= 신뢰점수 변경 이벤트 이력 저장
```

### 신규 테이블

```text
trust_events
```

컬럼:

```text
id
user_id
post_id
actor_user_id
type
score_change
previous_score
next_score
reason
metadata
created_at
updated_at
```

### 관계

```text
users 1:N trust_events
posts 1:N trust_events
users 1:N trust_events(actor_user_id)
```

의미:

```text
user_id
= 점수가 변경된 사용자

post_id
= 점수 변경과 관련된 게시글

actor_user_id
= 점수 변경을 유발한 사용자
```

### 이벤트 타입

```text
post_completed_author
post_completed_participant
post_cancelled_by_author
post_deleted_by_author
participant_cancelled
participant_no_show
agreement_confirmed
manual_adjustment
```

### API 영향

이번 변경에서 `trust_events` 조회 API는 아직 추가하지 않았다.

다만 `User` 응답에는 사용자 표시용 `trustGrade`가 추가된다. Swagger 변경 사항은 다음 문서에서 관리한다.

```text
docs/api/SWAGGER_CHANGELOG.md
```

### 배포 주의점

운영 DB에서는 `sequelize.sync({ alter: true })`에만 의존하지 않는 것이 좋다.

운영 배포 전에는 `trust_events` 생성을 명시적인 migration으로 분리하는 것이 안전하다.
