# 게시글 예외 케이스 API 개발 보고서

## 1. 작업 시점

```text
2026-05-25
브랜치: feature/post-exceptions-api
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
게시글 상태와 참여자 상태만으로는 가격 변경, 품절, 수령 정보 변경, 파손/누락/불량 같은 예외 사건을 기록할 수 없었다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드는 상세 화면에서 경고 배지나 예외 이력을 표시할 계약이 없었다.
운영자는 누가 어떤 예외를 등록했고 어떻게 처리했는지 추적할 수 없었다.

이번 작업으로 해결하려는 것:
게시글 단위 예외 케이스를 별도 엔티티로 기록하고, 상세 응답에 최신 처리 중 예외 요약을 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
post_exceptions 테이블과 별도 API를 추가한다.

선택하지 않은 대안:
posts.status 또는 post_participants.participant_status에 예외 상태를 섞지 않는다.

선택 이유:
예외 케이스는 한 게시글에 여러 번 발생할 수 있는 사건 이력이고, 게시글 전체 상태나 참여자 개인 상태와 책임이 다르다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
게시글 상태, 참여자 상태, 알림은 있었지만 예외 사건 이력은 없었다.

변경 후 구현:
가격 변경, 품절, 수령 정보 변경, 파손/누락/불량, 주최자 취소, 기타 예외를 post_exceptions에 저장한다.
GET /api/posts/{id}는 exceptionSummary를 함께 반환한다.
홈 피드와 내 공구/관심 공구 카드도 exceptionSummary를 함께 반환한다.

호환성:
기존 응답 필드는 유지하고 exceptionSummary만 추가한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/models/PostException.ts
src/repos/PostExceptionRepo.ts
src/services/PostExceptionService.ts
src/controllers/post.controller.ts
src/routes/posts/PostRoutes.ts
src/config/swagger.ts

핵심 로직:
작성자 또는 참여자가 예외 케이스를 등록할 수 있다.
예외 등록 시 작성자와 참여자에게 post_exception 알림을 만든다.
작성자 또는 예외 등록자가 예외 상태를 open/resolved/dismissed로 변경할 수 있다.

새로 추가된 모델/서비스/라우트:
PostExceptionModel
PostExceptionRepo
PostExceptionService
GET /api/posts/{id}/exceptions
POST /api/posts/{id}/exceptions
PATCH /api/posts/{id}/exceptions/{exceptionId}/status
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/posts/{id}
GET /api/posts/{id}/exceptions
POST /api/posts/{id}/exceptions
PATCH /api/posts/{id}/exceptions/{exceptionId}/status

요청 변경:
신규 예외 등록/상태 변경 요청 바디 추가

응답 변경:
GET /api/posts/{id}에 exceptionSummary 추가
GET /api/posts와 GET /api/users/{userId}/my-posts 카드 항목에 exceptionSummary 추가

프론트엔드 수정 필요 여부:
상세 화면 경고 배지와 예외 이력 화면에서 신규 필드를 사용할 수 있다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블:
post_exceptions

신규 컬럼:
notifications.type enum에 post_exception 추가

변경된 관계:
posts 1:N post_exceptions
users 1:N post_exceptions(reporter_id)

마이그레이션 필요 여부:
운영 DB에 post_exceptions 테이블 생성 및 notifications.type enum 반영 필요

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
exceptionSummary.hasOpenException
exceptionSummary.openCount
exceptionSummary.latestType
exceptionSummary.latestTitle
exceptionSummary.latestMessage
exceptionSummary.severity
exceptionSummary.latest.displayTitle
exceptionSummary.latest.displayMessage
exceptionSummary.latest.typeLabel
exceptionSummary.latest.handlingGuide

숨겨야 할 필드:
없음

요청 payload 변경:
예외 등록/상태 변경 API 신규 payload 추가

호출 URL 변경:
기존 URL 변경 없음. 신규 URL만 추가.

주의할 상태값:
type: price_changed, sold_out, pickup_changed, damaged, seller_cancelled, other
status: open, resolved, dismissed
severity: info, warning, critical
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
```

## 10. 남은 작업

```text
후속 API:
결제/환불 도메인이 생기면 예외 상태 resolved와 환불 처리 결과를 연결한다.

운영/배포 주의점:
notifications.type enum에 post_exception이 반영되어야 한다.

테스트 보강:
권한별 예외 등록/상태 변경 서비스 테스트를 추가할 수 있다.
```
