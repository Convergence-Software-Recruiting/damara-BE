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

## 2026-05-16 - Post 등록/상세 UI 컬럼 추가

브랜치:

```text
feature/post-detail-fields
```

변경 전 기준 커밋:

```text
0b16e89
```

### 변경 요약

공동구매 등록/상세 화면에서 필요한 상품명, 수령 일정, 안내, 공구 유형, 태그, 공지 정보를 저장하기 위해 `posts` 테이블에 nullable 컬럼을 추가한다.

기존 게시글 데이터는 유지하고, 새 필드는 값이 없을 수 있도록 설계했다.

### 변경된 테이블

```text
posts
```

### 신규 컬럼

```text
product_name
pickup_date
pickup_start_time
pickup_end_time
pickup_guide
group_buy_type
tags
notice
```

정의:

```text
product_name: VARCHAR(200), nullable
pickup_date: DATE, nullable
pickup_start_time: TIME, nullable
pickup_end_time: TIME, nullable
pickup_guide: TEXT, nullable
group_buy_type: VARCHAR(50), nullable
tags: JSON, nullable
notice: TEXT, nullable
```

### 관계 변경

관계 변경은 없다.

### API 영향

다음 API의 요청/응답에 신규 필드가 추가된다.

```text
POST /api/posts
PUT /api/posts/{id}
GET /api/posts
GET /api/posts/{id}
GET /api/posts/student/{studentId}
PATCH /api/posts/{id}/status
GET /api/users/{userId}/favorites
```

Swagger 변경 사항은 다음 문서에서 관리한다.

```text
docs/api/SWAGGER_CHANGELOG.md
```

### 배포 주의점

현재 서버는 `sequelize.sync({ alter: true })`를 사용하지만, 기존 `users` 인덱스 경고 때문에 alter가 중간에 실패할 수 있다.

이를 보완하기 위해 서버 시작 시 `posts` 테이블의 신규 컬럼을 별도로 확인하고 없으면 추가한다.

운영 반영용 SQL:

```sql
ALTER TABLE posts
  ADD COLUMN product_name VARCHAR(200) NULL,
  ADD COLUMN pickup_date DATE NULL,
  ADD COLUMN pickup_start_time TIME NULL,
  ADD COLUMN pickup_end_time TIME NULL,
  ADD COLUMN pickup_guide TEXT NULL,
  ADD COLUMN group_buy_type VARCHAR(50) NULL,
  ADD COLUMN tags JSON NULL,
  ADD COLUMN notice TEXT NULL;
```

## 2026-05-14 - 참여자별 진행 상태 컬럼 추가

브랜치:

```text
feature/participant-status
```

변경 전 기준 커밋:

```text
8953132
```

### 변경 요약

내 공구 화면에서 사용자별 참여 진행 상태를 표시하기 위해 `post_participants` 테이블에 상태 컬럼을 추가한다.

게시글 전체 상태는 기존 `posts.status`가 계속 담당하고, 참여자별 상태는 `post_participants.participant_status`가 담당한다.

### 변경된 테이블

```text
post_participants
```

### 신규 컬럼

```text
participant_status
```

정의:

```text
type: ENUM('participating', 'payment_pending', 'pickup_ready', 'received')
nullable: false
default: 'participating'
```

상태 의미:

```text
participating = 참여중
payment_pending = 입금대기
pickup_ready = 수령예정
received = 수령완료
```

### 관계 변경

관계 변경은 없다.

기존 관계:

```text
posts N:M users
중간 테이블: post_participants
```

### API 영향

다음 응답에 `participantStatus`가 추가된다.

```text
GET /api/posts/{id}
GET /api/posts/{id}/participants
GET /api/posts/user/{userId}/participated
```

상태 변경 API가 추가된다.

```text
PATCH /api/posts/{id}/participants/{userId}/status
```

Swagger 변경 사항은 다음 문서에서 관리한다.

```text
docs/api/SWAGGER_CHANGELOG.md
```

### 배포 주의점

현재 서버는 `sequelize.sync({ alter: true })`를 사용하지만, 운영 DB에서는 명시적인 ALTER를 먼저 적용하는 편이 안전하다.

로컬/개발 환경에서는 `sync({ alter: true })`가 기존 `users` 인덱스 경고로 중단되어도 `syncDatabase()`가 `post_participants.participant_status` 컬럼을 별도로 확인하고 없으면 추가한다.

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
