# Trust Score & Trust Grade

## 1. 목적

DAMARA는 대학교 내부 공동구매 서비스이므로, 사용자에게 노출되는 신뢰도를 학교 맥락에 맞는 **신뢰학점**으로 표현한다.

다만 백엔드 내부에서는 계산 안정성과 정책 확장성을 위해 기존 `trustScore`를 유지한다.

```text
내부 계산값: trustScore 0~100
외부 표시값: trustGrade 2.5~4.5
기본값: trustScore 50 = trustGrade 3.5
```

이번 브랜치의 목표는 신뢰도를 단순 숫자에서 이벤트 기반 정책으로 확장하고, 사용자-facing 표현을 “신뢰학점”으로 리팩토링하는 것이다.

현재 브랜치:

```text
feature/trust-safety-filtering
```

## 2. 왜 학점 컨셉인가

온도 방식도 가능하지만, DAMARA는 학교 구성원 기반 공동구매 서비스다. 따라서 학점 컨셉은 서비스 맥락과 더 잘 맞는다.

```text
일반 중고거래 서비스
= 매너온도 같은 생활형 표현이 자연스러움

대학교 내부 공동구매 서비스
= 신뢰학점 같은 캠퍼스 맥락 표현이 자연스러움
```

다만 실제 성적처럼 보이면 사용자가 부담을 느낄 수 있으므로, 명칭은 단순 “학점”이 아니라 **신뢰학점**으로 사용한다.

## 3. 핵심 설계

현재 구조는 다음과 같다.

```text
사용자 행동
  -> PostService / PostParticipantService
  -> TrustService
  -> users.trust_score 업데이트
  -> trust_events 이력 저장
  -> API 응답에서 trustGrade 계산
```

역할 분리는 다음과 같다.

```text
UserService
= 사용자 생성, 조회, 로그인 같은 사용자 기본 로직 담당

TrustService
= 신뢰 정책, 점수 계산, 신뢰학점 변환, 점수 변경 이력 저장 담당
```

앞으로 신뢰도를 변경하는 기능은 `users.trust_score`를 직접 수정하지 않고 `TrustService`를 거쳐야 한다.

## 4. 내부값과 외부값

### 내부값: trustScore

`trustScore`는 DB에 저장되는 내부 정책 값이다.

```text
컬럼: users.trust_score
범위: 0~100
회원가입 기본값: 50
```

내부 정책은 정수 점수로 유지한다.

이유:

```text
1. +10, -5 같은 정책 계산이 명확하다.
2. 소수점 누적 오차를 피할 수 있다.
3. 추후 온도, 학점, 등급 등 다른 표시 방식으로 바꾸기 쉽다.
4. 기존 DB 구조와 호환된다.
```

### 외부값: trustGrade

`trustGrade`는 사용자에게 보여주는 신뢰학점이다.

```text
API 응답 필드: trustGrade
범위: 2.5~4.5
기본값: 3.5
소수점: 첫째 자리까지 표시
```

`trustGrade`는 DB에 저장하지 않고, `trustScore`를 기반으로 계산한다.

## 5. 신뢰학점 변환식

변환 공식은 다음과 같다.

```text
trustGrade = 2.5 + (trustScore / 100) * 2.0
```

같은 의미로 쓰면:

```text
trustGrade = 3.5 + (trustScore - 50) * 0.02
```

예시:

| trustScore | trustGrade | 의미 |
| ---: | ---: | --- |
| 0 | 2.5 | 매우 낮은 신뢰 |
| 25 | 3.0 | 주의 필요 |
| 50 | 3.5 | 기본 신뢰 |
| 75 | 4.0 | 좋은 신뢰 |
| 100 | 4.5 | 매우 높은 신뢰 |

코드 기준:

```ts
trustGrade = Number((2.5 + (trustScore / 100) * 2).toFixed(1));
```

## 6. 점수 범위 보정

`trustScore`는 0점에서 100점 사이로 제한한다.

```text
최소 점수: 0
최대 점수: 100
회원가입 기본 점수: 50
```

점수 변경 후 0보다 작아지면 0으로 보정하고, 100보다 커지면 100으로 보정한다.

예시:

```text
현재 97점인 사용자가 +10 이벤트를 받음
계산상 107점
최종 저장 점수는 100점
표시 신뢰학점은 4.5

현재 2점인 사용자가 -5 이벤트를 받음
계산상 -3점
최종 저장 점수는 0점
표시 신뢰학점은 2.5
```

## 7. 현재 구현된 정책

현재 구현된 정책은 `src/services/TrustService.ts`의 `TRUST_POLICY`를 기준으로 한다.

| 이벤트 | 대상자 | trustScore 변화 | trustGrade 변화 | 적용 시점 |
| --- | --- | ---: | ---: | --- |
| 공동구매 거래 완료 | 작성자 | +10 | +0.2 | 게시글 상태가 `completed`가 될 때 |
| 공동구매 거래 완료 | 참여자 | +5 | +0.1 | 게시글 상태가 `completed`가 될 때 |
| 공동구매 취소 | 작성자 | -5 | -0.1 | 게시글 상태가 `cancelled`가 될 때 |
| 공동구매 게시글 삭제 | 작성자 | -5 | -0.1 | 게시글 삭제 시 |
| 공동구매 참여 취소 | 참여자 | -3 | -0.1 미만 | 참여자가 참여를 취소할 때 |
| 노쇼 확정 | 대상 참여자 | -10 | -0.2 | 아직 API 미구현, 정책 상수만 예약 |

주의:

```text
trustGrade는 소수점 첫째 자리까지만 표시하므로,
-3점 같은 작은 변화는 표시값에서 바로 티가 나지 않을 수 있다.
하지만 내부 trustScore와 trust_events에는 정확히 기록된다.
```

## 8. 상태값 기준

게시글 상태값의 의미는 다음처럼 해석한다.

| 상태 | 의미 | 점수 변경 여부 |
| --- | --- | --- |
| `open` | 모집중 | 없음 |
| `closed` | 모집 마감 | 없음 |
| `in_progress` | 거래 진행중 | 없음 |
| `completed` | 거래 완료 | 작성자 +10, 참여자 +5 |
| `cancelled` | 거래 취소 | 작성자 -5 |

중요한 기준:

```text
closed는 거래 완료가 아니다.
closed는 모집 마감 상태다.
따라서 closed에서는 신뢰학점 보상을 주지 않는다.
```

프론트엔드에서 거래 완료 버튼을 만들 경우 `closed`가 아니라 `completed`를 보내야 한다.

## 9. API 응답 기준

사용자 응답에는 다음 두 값을 모두 포함한다.

```json
{
  "id": "user-uuid",
  "nickname": "홍길동",
  "studentId": "20241234",
  "trustScore": 50,
  "trustGrade": 3.5
}
```

각 필드의 의미:

```text
trustScore
= 백엔드 내부 정책 값이다.
= 관리자, 정책 계산, 필터링 기준으로 사용한다.

trustGrade
= 사용자에게 보여줄 신뢰학점이다.
= 프론트엔드는 기본적으로 이 값을 표시한다.
```

프론트엔드 표시 예시:

```text
신뢰학점 3.5
신뢰학점 4.1
신뢰학점 2.9
```

## 10. TrustEvent 기록 기준

신뢰도가 변경될 때마다 `trust_events` 테이블에 이력이 남는다.

### 컬럼

| 컬럼 | 의미 |
| --- | --- |
| `id` | 이벤트 ID |
| `user_id` | 점수가 변경되는 사용자 |
| `post_id` | 관련 게시글, 없으면 null |
| `actor_user_id` | 이벤트를 발생시킨 사용자, 없으면 null |
| `type` | 이벤트 타입 |
| `score_change` | 점수 변화량 |
| `previous_score` | 변경 전 점수 |
| `next_score` | 변경 후 점수 |
| `reason` | 사람이 읽을 수 있는 사유 |
| `metadata` | 추후 확장을 위한 JSON 데이터 |
| `created_at` | 이벤트 발생 시각 |

### 이벤트 타입

현재 정의된 이벤트 타입은 다음과 같다.

| 타입 | 의미 | 현재 사용 여부 |
| --- | --- | --- |
| `post_completed_author` | 거래 완료 작성자 보상 | 사용 |
| `post_completed_participant` | 거래 완료 참여자 보상 | 사용 |
| `post_cancelled_by_author` | 작성자 거래 취소 감점 | 사용 |
| `post_deleted_by_author` | 작성자 게시글 삭제 감점 | 사용 |
| `participant_cancelled` | 참여자 참여 취소 감점 | 사용 |
| `participant_no_show` | 노쇼 확정 감점 | 예약 |
| `agreement_confirmed` | 사전 약속 확인 | 예약 |
| `manual_adjustment` | 관리자 또는 legacy 수동 조정 | 사용 가능 |

## 11. 현재 코드 적용 위치

### 거래 완료

게시글 상태가 `completed`로 바뀌면 신뢰도 보상이 적용된다.

```text
PostService.updatePostStatus()
PostService.updatePost()
```

적용 정책:

```text
작성자: trustScore +10, trustGrade +0.2
참여자: trustScore +5, trustGrade +0.1
```

### 거래 취소

게시글 상태가 `cancelled`로 바뀌면 작성자에게 감점이 적용된다.

```text
PostService.updatePostStatus()
PostService.updatePost()
```

적용 정책:

```text
작성자: trustScore -5, trustGrade -0.1
```

### 게시글 삭제

게시글을 삭제하면 작성자에게 감점이 적용된다.

```text
PostService.deletePost()
```

적용 정책:

```text
작성자: trustScore -5, trustGrade -0.1
```

### 참여 취소

참여자가 공동구매 참여를 취소하면 참여자에게 감점이 적용된다.

```text
PostParticipantService.leavePost()
```

적용 정책:

```text
참여자: trustScore -3
```

표시 학점은 소수점 첫째 자리 반올림 때문에 즉시 변하지 않을 수 있다.

## 12. 왜 TrustEvent가 필요한가

단순히 `users.trust_score`만 있으면 다음 질문에 답할 수 없다.

```text
왜 이 사용자는 신뢰학점 3.1인가?
언제 감점되었는가?
어떤 게시글에서 문제가 생겼는가?
작성자 때문에 감점되었는가, 참여자 때문에 감점되었는가?
반복 취소 사용자인가?
노쇼 이력이 있는가?
```

`trust_events`를 남기면 사용자 신뢰도를 설명할 수 있다.

예시:

```text
초기 trustScore: 50
초기 trustGrade: 3.5

+5 공동구매 참여 완료
-3 참여 취소
-5 작성한 공동구매 취소
= 현재 trustScore 47
= 현재 trustGrade 3.4
```

이 이력은 이후 다음 기능의 근거가 된다.

```text
신뢰학점 낮은 사용자 참여 제한
반복 취소 사용자 탐지
노쇼 신고 처리
거래 분쟁 시 이력 확인
관리자 수동 조정
프론트엔드 신뢰학점 표시
```

## 13. 현재 구현과 예정 기능 구분

### 현재 구현됨

```text
users.trust_score 필드
trustGrade 계산 함수
User API 응답에 trustGrade 포함
TrustEvent 모델
TrustService
점수 0~100 보정
거래 완료 보상
거래 취소 감점
게시글 삭제 감점
참여 취소 감점
점수 변경 이력 저장
```

### 아직 구현 전

```text
사전 약속 확인 API
노쇼 신고 API
관리자 수동 점수 조정 API
신뢰학점 기반 게시글 필터링
신뢰학점 기반 참여 제한
학교 구성원 인증 레벨
신뢰 이벤트 조회 API
```

## 14. 다음 구현 예정: 사전 약속 확인

이미지에서 제안한 “거래 분쟁 최소화를 위한 사전 약속 확인 절차”는 다음 단계에서 구현한다.

추천 구조:

```text
post_participants.agreement_status
post_participants.agreement_accepted_at
```

예상 상태:

```text
pending
accepted
```

예상 흐름:

```text
1. 사용자가 공동구매 참여 요청
2. 참여 row 생성
3. agreement_status = pending
4. 사용자가 약속 확인 버튼 클릭
5. agreement_status = accepted
6. accepted 상태만 최종 참여자로 간주
```

이 기능이 들어가면 `agreement_confirmed` 이벤트를 `trust_events`에 기록할 수 있다.

## 15. 다음 구현 예정: 노쇼 정책

현재 `PARTICIPANT_NO_SHOW = -10` 정책 상수와 `participant_no_show` 이벤트 타입은 예약되어 있다.

다만 노쇼는 악용 가능성이 있으므로, 바로 감점하지 않고 신고/확정 단계를 두는 것이 안전하다.

추천 흐름:

```text
1. 작성자가 참여자를 노쇼로 신고
2. no_show_reports row 생성
3. 상태는 pending
4. 관리자 또는 검증 로직이 confirmed 처리
5. confirmed 시 TrustService로 -10 적용
```

즉, 노쇼 감점은 신고 생성 시점이 아니라 확정 시점에 적용한다.

## 16. 운영 주의사항

현재 서버는 `sequelize.sync({ alter: true })`를 사용하고 있다.

이 방식은 개발 중에는 편하지만 운영 DB에서는 unique index 중복 생성 같은 문제가 생길 수 있다. 실제 운영에서는 마이그레이션 방식으로 전환하는 것이 좋다.

이번 브랜치에서 추가되는 테이블:

```text
trust_events
```

운영 반영 전에는 마이그레이션 파일로 분리하는 것을 권장한다.

## 17. 요약

이번 작업의 핵심은 신뢰도를 대학교 서비스에 맞는 신뢰학점 컨셉으로 리팩토링한 것이다.

```text
기존:
users.trust_score 숫자만 변경
프론트에는 신뢰점수 n점으로 표시

변경:
내부는 trustScore 0~100 유지
외부는 trustGrade 2.5~4.5로 표시
TrustService가 정책과 변환을 담당
trust_events에 변경 이력 저장
completed/cancelled/delete/leave 이벤트 기준 명확화
```

현재 기준:

```text
회원가입: trustScore 50, trustGrade 3.5
거래 완료 작성자: +10점, +0.2
거래 완료 참여자: +5점, +0.1
거래 취소 작성자: -5점, -0.1
게시글 삭제 작성자: -5점, -0.1
참여 취소 참여자: -3점
노쇼 확정 참여자: -10점, -0.2 예정
```
