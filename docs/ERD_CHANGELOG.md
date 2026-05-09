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
docs/SWAGGER_CHANGELOG.md
```

### 배포 주의점

운영 DB에서는 `sequelize.sync({ alter: true })`에만 의존하지 않는 것이 좋다.

운영 배포 전에는 `trust_events` 생성을 명시적인 migration으로 분리하는 것이 안전하다.
