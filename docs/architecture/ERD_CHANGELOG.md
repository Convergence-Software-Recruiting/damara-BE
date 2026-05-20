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

## 2026-05-20 - FAQ 테이블 추가

브랜치:

```text
feature/faqs-api
```

변경 전 기준 커밋:

```text
2eb657e
```

### 변경 요약

마이페이지 FAQ 화면의 질문/답변 데이터를 서버 DB에서 관리하기 위해 `faqs` 테이블을 추가한다.

FAQ 목록은 활성 FAQ만 사용자 화면에 노출하며, 카테고리와 정렬 순서를 기준으로 조회한다.

### 신규 테이블

```text
faqs
```

### 신규 컬럼

```text
id: UUID, primary key
category: ENUM(trade, account, payment, pickup, etc), not null, default etc
question: VARCHAR(300), not null
answer: TEXT, not null
sort_order: INTEGER, not null, default 0
is_active: BOOLEAN, not null, default true
created_at: DATETIME, not null
updated_at: DATETIME, not null
```

### 인덱스

```text
faqs(category, is_active, sort_order)
faqs(is_active, sort_order)
```

### 관계 변경

관계 변경은 없다.

### API 영향

신규 API가 추가된다.

```text
GET /api/faqs
```

Swagger 변경 사항은 다음 문서에서 관리한다.

```text
docs/api/SWAGGER_CHANGELOG.md
```

### 배포 주의점

현재 서버는 `sequelize.sync({ alter: true })`를 사용하지만, 기존 `users` 인덱스 경고 때문에 alter가 중간에 실패할 수 있다.

이를 보완하기 위해 서버 시작 시 `faqs` 테이블을 별도로 확인하고 없으면 생성한다.

운영 반영용 SQL:

```sql
CREATE TABLE faqs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  category ENUM('trade', 'account', 'payment', 'pickup', 'etc') NOT NULL DEFAULT 'etc',
  question VARCHAR(300) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE INDEX faqs_category_is_active_sort_order
  ON faqs (category, is_active, sort_order);
CREATE INDEX faqs_is_active_sort_order
  ON faqs (is_active, sort_order);
```

## 2026-05-19 - 공지사항 테이블 추가

브랜치:

```text
feature/notices-api
```

변경 전 기준 커밋:

```text
6949395
```

### 변경 요약

서비스 공지, 이벤트, 점검, 정책 안내를 서버 DB에서 관리하기 위해 `notices` 테이블을 추가한다.

공지 목록은 고정 여부와 생성일 기준으로 정렬되며, 유형별 필터를 지원한다.

### 신규 테이블

```text
notices
```

### 신규 컬럼

```text
id: UUID, primary key
title: VARCHAR(200), not null
summary: VARCHAR(500), nullable
content: TEXT, not null
type: ENUM(service, event, maintenance, policy), not null, default service
is_pinned: BOOLEAN, not null, default false
created_at: DATETIME, not null
updated_at: DATETIME, not null
```

### 인덱스

```text
notices(type, created_at)
notices(is_pinned, created_at)
```

### 관계 변경

관계 변경은 없다.

### API 영향

신규 API가 추가된다.

```text
GET /api/notices
GET /api/notices/{id}
```

Swagger 변경 사항은 다음 문서에서 관리한다.

```text
docs/api/SWAGGER_CHANGELOG.md
```

### 배포 주의점

현재 서버는 `sequelize.sync({ alter: true })`를 사용하지만, 기존 `users` 인덱스 경고 때문에 alter가 중간에 실패할 수 있다.

이를 보완하기 위해 서버 시작 시 `notices` 테이블을 별도로 확인하고 없으면 생성한다.

운영 반영용 SQL:

```sql
CREATE TABLE notices (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  summary VARCHAR(500) NULL DEFAULT NULL,
  content TEXT NOT NULL,
  type ENUM('service', 'event', 'maintenance', 'policy') NOT NULL DEFAULT 'service',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE INDEX notices_type_created_at ON notices (type, created_at);
CREATE INDEX notices_is_pinned_created_at ON notices (is_pinned, created_at);
```

## 2026-05-19 - 사용자 설정 테이블 추가

브랜치:

```text
feature/user-settings-api
```

변경 전 기준 커밋:

```text
b194ece
```

### 변경 요약

마이페이지 설정 화면의 알림 및 방해금지 시간 설정을 사용자별로 저장하기 위해 `user_settings` 테이블을 추가한다.

사용자당 설정 row는 하나만 가진다. 설정이 없는 사용자가 `GET /api/users/{id}/settings`를 호출하면 기본값으로 row를 생성한다.

### 신규 테이블

```text
user_settings
```

### 신규 컬럼

```text
id: UUID, primary key
user_id: UUID, not null, unique, users.id 참조
push_enabled: BOOLEAN, not null, default true
chat_notification_enabled: BOOLEAN, not null, default true
post_notification_enabled: BOOLEAN, not null, default true
marketing_notification_enabled: BOOLEAN, not null, default false
quiet_hours_enabled: BOOLEAN, not null, default false
quiet_hours_start: VARCHAR(5), not null, default "23:00"
quiet_hours_end: VARCHAR(5), not null, default "08:00"
created_at: DATETIME, not null
updated_at: DATETIME, not null
```

### 관계 변경

```text
users 1 : 0..1 user_settings
```

`user_settings.user_id`는 `users.id`를 참조하며, 사용자 삭제 시 CASCADE로 삭제된다.

### API 영향

신규 API가 추가된다.

```text
GET /api/users/{id}/settings
PUT /api/users/{id}/settings
```

Swagger 변경 사항은 다음 문서에서 관리한다.

```text
docs/api/SWAGGER_CHANGELOG.md
```

### 배포 주의점

현재 서버는 `sequelize.sync({ alter: true })`를 사용하지만, 기존 `users` 인덱스 경고 때문에 alter가 중간에 실패할 수 있다.

이를 보완하기 위해 서버 시작 시 `user_settings` 테이블을 별도로 확인하고 없으면 생성한다.

운영 반영용 SQL:

```sql
CREATE TABLE user_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  chat_notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  post_notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_notification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start VARCHAR(5) NOT NULL DEFAULT '23:00',
  quiet_hours_end VARCHAR(5) NOT NULL DEFAULT '08:00',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT user_settings_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
```

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
