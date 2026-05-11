# DAMARA 다음 기능 로드맵

## 1. 작업 시점

```text
작성일: 2026-05-10
기준 브랜치: feature/trust-safety-filtering
기준 PR: #7 신뢰학점 기반 유저 신뢰도 체계
```

이 문서는 발표 자료의 다음 기능 후보를 현재 백엔드 구현 상태와 비교해 정리한 로드맵이다.

목표는 다음 세 가지다.

```text
1. 무엇이 이미 구현됐는지 구분한다.
2. 무엇이 아직 남았는지 명확히 한다.
3. 다음 개발 순서를 정한다.
```

## 2. 전체 기능 후보

발표 자료 기준 다음 기능 후보는 세 축으로 나뉜다.

```text
1. 신뢰 및 보안 데이터 기반의 유저 필터링 체계
2. 거래 방식의 다각화
3. 예외 케이스 대응 로직
```

각 기능은 독립적이지만, 실제 구현 순서는 신뢰/분쟁 데이터부터 쌓는 것이 좋다.

이유는 거래 방식이나 예외 케이스 대응도 결국 “누가 어떤 상황에서 어떤 행동을 했는가”라는 이력 데이터가 필요하기 때문이다.

## 3. 기능 1: 신뢰 및 보안 데이터 기반의 유저 필터링 체계

### 기획 배경

공동구매는 단순 게시글 CRUD보다 사용자 간 신뢰가 중요하다.

특히 대학교 내부 서비스에서는 다음 문제가 발생할 수 있다.

```text
참여자가 약속만 하고 실제로 오지 않음
작성자가 반복적으로 모집을 취소함
거래 완료 여부가 명확하지 않음
사용자의 신뢰도를 설명할 근거가 없음
학교 구성원인지 검증 수준이 낮음
```

따라서 단순한 “좋아요”나 “별점”보다 거래 행동 기반의 신뢰 데이터가 필요하다.

### 현재 구현됨

PR #7 기준 이미 구현된 범위는 다음과 같다.

```text
users.trust_score
trustGrade 계산
User 응답의 trustGrade 포함
trust_events 테이블
TrustService
거래 완료 시 보상
거래 취소 시 감점
게시글 삭제 시 감점
참여 취소 시 감점
신뢰 이벤트 조회 API
Swagger/ERD 변경 이력 문서화
```

현재 신뢰도 구조는 다음과 같다.

```text
내부 정책 값: trustScore 0~100
사용자 표시 값: trustGrade 2.5~4.5
기본값: trustScore 50 = trustGrade 3.5
```

신뢰 이벤트 조회 API:

```text
GET /api/users/:id/trust-events
```

프론트엔드는 사용자 화면에서 다음 값을 우선 사용한다.

```text
trustGrade
previousGrade
nextGrade
reason
createdAt
```

### 아직 남은 기능

```text
사전 약속 확인 API
노쇼 신고/확정/제재 API
상습 취소 사용자 탐지
신뢰학점 기반 참여 제한
신뢰학점 기반 경고/필터링
학교 구성원 인증 단계 다층화
관리자 수동 조정 API
```

### 추천 구현 순서

#### 1단계: 사전 약속 확인 API

거래 전 참여자가 약속 조건을 확인했는지 기록한다.

추천 DB 변경:

```text
post_participants.agreement_status
post_participants.agreement_accepted_at
```

예상 상태:

```text
pending
accepted
```

예상 API:

```text
PATCH /api/posts/:postId/participants/:userId/agreement
```

예상 효과:

```text
거래 전 동의 여부 추적
분쟁 발생 시 근거 확보
노쇼 신고 전 사전 약속 여부 확인 가능
```

#### 2단계: 노쇼 신고/확정 API

노쇼는 바로 감점하면 악용될 수 있다.

따라서 신고와 확정 단계를 분리한다.

추천 DB:

```text
no_show_reports
```

예상 컬럼:

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

예상 상태:

```text
pending
confirmed
rejected
cancelled
```

예상 API:

```text
POST /api/posts/:postId/no-show-reports
PATCH /api/no-show-reports/:id/confirm
PATCH /api/no-show-reports/:id/reject
```

확정 시에만 다음 신뢰 이벤트를 기록한다.

```text
participant_no_show
scoreChange: -15
```

#### 3단계: 신뢰학점 기반 참여 제한

낮은 신뢰학점 사용자에게 바로 차단을 걸기보다, 단계적으로 적용한다.

추천 정책:

```text
3.5 이상: 정상
3.0 이상 3.5 미만: 주의 문구 표시
2.8 이상 3.0 미만: 참여 전 추가 확인 필요
2.8 미만: 일부 공동구매 참여 제한
```

초기에는 강한 차단보다 경고와 추가 확인이 안전하다.

#### 4단계: 학교 구성원 인증 단계 다층화

현재 사용자 정보에는 이메일, 학번, 학과가 있다.

추가로 인증 수준을 나눌 수 있다.

예상 필드:

```text
users.verification_level
users.verified_at
```

예상 단계:

```text
none
email_verified
student_id_verified
campus_verified
```

## 4. 기능 2: 거래 방식의 다각화

### 기획 배경

현재 공동구매 게시글은 거래 방식이 충분히 구조화되어 있지 않다.

하지만 실제 학교 공동구매에서는 다음 방식이 섞인다.

```text
오프라인 거점 수령
직접 전달
배달형 전달
대표 수령 후 분배
```

거래 방식이 명확하지 않으면 참여자가 어디서 언제 받아야 하는지 혼동한다.

### 아직 구현 전

```text
거래 방식 필드
공식 수령 장소 관리
지도 표시용 장소 데이터
배달/전달 담당자 지정
배달비 감면/분배 비용 우대 정책
게시글 생성 시 거래 방식 선택
```

### 추천 구현 방향

단순히 `posts.pickupLocation` 문자열만 쓰면 지도, 필터, 공식 장소 관리가 어렵다.

그래서 다음처럼 단계적으로 가는 것이 좋다.

#### 1단계: posts에 거래 방식 enum 추가

예상 필드:

```text
posts.trade_method
```

예상 값:

```text
pickup
direct
delivery
group_delivery
```

#### 2단계: 공식 거래 장소 테이블 추가

예상 테이블:

```text
trade_locations
```

예상 컬럼:

```text
id
name
campus
description
latitude
longitude
is_active
created_at
updated_at
```

예상 장소:

```text
명지대 기숙사 로비
인문캠퍼스 학생회관 앞
다마라 존
```

#### 3단계: 게시글과 거래 장소 연결

예상 필드:

```text
posts.trade_location_id
posts.custom_trade_location
```

공식 장소면 `trade_location_id`를 사용한다.

예외적인 장소면 `custom_trade_location`을 사용한다.

#### 4단계: 전달 담당자/분배 비용 정책

예상 필드:

```text
posts.delivery_owner_id
posts.delivery_fee
posts.delivery_fee_policy
```

예상 정책:

```text
none
equal_split
owner_discount
custom
```

## 5. 기능 3: 예외 케이스 대응 로직

### 기획 배경

공동구매는 계획대로만 진행되지 않는다.

대표 예외는 다음과 같다.

```text
모집 당시 가격과 실제 구매 가격이 다름
구매하려던 물품이 품절됨
수령한 물건이 파손됨
```

이 경우 단순히 게시글을 취소하면 참여자에게 혼란이 생긴다.

따라서 예외 상황을 기록하고, 참여자에게 알리고, 비용 정산 또는 취소 흐름을 제공해야 한다.

### 아직 구현 전

```text
가격 변경 대응
품절 대응
파손 신고
비용 차감/환불 계산
참여자 푸시 알림
자동 취소 또는 재동의 흐름
중재 가이드라인
```

### 추천 구현 방향

예외 처리는 하나의 거대한 상태값으로 처리하기보다, 사건 기반으로 기록하는 것이 좋다.

추천 테이블:

```text
post_incidents
```

예상 컬럼:

```text
id
post_id
reporter_id
type
status
description
metadata
created_at
updated_at
resolved_at
```

예상 타입:

```text
price_changed
out_of_stock
item_damaged
partial_refund
manual_mediation
```

예상 상태:

```text
open
notified
resolved
cancelled
```

### 가격 변경 대응

예상 필드:

```text
original_price
actual_price
price_difference
requires_reconfirm
```

흐름:

```text
1. 작성자가 실제 구매 가격 변경 등록
2. 참여자에게 알림 발송
3. 가격 차이가 크면 참여자 재동의 필요
4. 미동의 참여자는 취소/환불 처리
```

### 품절 대응

흐름:

```text
1. 작성자가 품절 상태 등록
2. 참여자에게 즉시 알림
3. 대체 상품 제안 또는 공동구매 취소
4. 취소 시 환불/참여 취소 처리
```

### 파손 대응

흐름:

```text
1. 수령자가 파손 신고
2. 사진/설명 첨부
3. 작성자 또는 관리자 확인
4. 비용 차감/부분 환불/중재 처리
```

파손은 책임 소재가 민감하므로, 바로 신뢰학점을 깎기보다 사건 기록과 중재 상태를 먼저 둔다.

## 6. 추천 개발 순서

현재 코드 상태를 기준으로 추천 순서는 다음과 같다.

```text
1. 사전 약속 확인 API
2. 노쇼 신고/확정 API
3. 신뢰학점 기반 참여 제한
4. 거래 방식 enum 추가
5. 공식 거래 장소 테이블 추가
6. 지도 표시용 장소 API
7. 가격 변경 incident
8. 품절 incident
9. 파손 incident
```

## 7. PR 분리 제안

기능 범위가 크므로 한 PR에 모두 넣지 않는다.

추천 PR 단위:

```text
PR 1: 사전 약속 확인 API
PR 2: 노쇼 신고/확정 API
PR 3: 신뢰학점 기반 참여 제한
PR 4: 거래 방식 enum 및 공식 장소 모델
PR 5: 지도 표시용 장소 API
PR 6: 예외 케이스 incident 모델
PR 7: 가격 변경/품절/파손 처리 API
```

각 PR은 다음 문서를 함께 갱신한다.

```text
docs/api/SWAGGER_CHANGELOG.md
docs/architecture/ERD_CHANGELOG.md
docs/features/해당_기능_문서.md
```

## 8. 다음 액션 추천

가장 먼저 구현할 기능은 다음이다.

```text
사전 약속 확인 API
```

이유:

```text
trust_events의 agreement_confirmed 타입과 자연스럽게 연결됨
노쇼 신고의 사전 근거가 됨
DB 변경 범위가 post_participants 중심이라 비교적 작음
FE도 버튼/상태 표시로 구현 범위가 명확함
```

예상 첫 작업:

```text
post_participants에 agreement_status, agreement_accepted_at 추가
PATCH /api/posts/:postId/participants/:userId/agreement 추가
Swagger/ERD/docs 갱신
```
