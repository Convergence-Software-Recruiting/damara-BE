# 신뢰 요약 API 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-20
브랜치: feature/trust-summary-api
관련 커밋: 작업 후 기록
```

## 2. 문제 배경

```text
기존 문제:
사용자 신뢰 이벤트 이력 API는 있었지만, 현재 화면 카드에 바로 표시할 신뢰 요약 API는 없었다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드가 신뢰학점, 라벨, 완료 거래 수, 취소/노쇼 수, 배지를 화면마다 직접 조합해야 했다.

이번 작업으로 해결하려는 것:
GET /api/users/{id}/trust-summary로 현재 신뢰 요약값을 한 번에 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
Users 도메인 아래에 GET /api/users/{id}/trust-summary를 추가한다.
기존 trust_events와 posts/post_participants 집계를 재사용한다.
신뢰학점, 라벨, 배지, 완료 거래 수, 응답률, 취소/노쇼 수를 한 번에 반환한다.

선택하지 않은 대안:
마이페이지 summary 응답만 확장하지 않는다.
별도 랭킹/응답 시간 테이블은 이번 작업에 추가하지 않는다.

선택 이유:
PDF 기준으로 신뢰 요약은 마이페이지 외에도 공구 상세 판매자 카드, 참여자 카드에서 독립적으로 필요하다.
DB 구조 없이 기존 데이터로 계산 가능한 범위부터 먼저 제공하는 편이 빠르고 안전하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/users/{id}/trust-events는 신뢰점수 변경 이력만 반환했다.
GET /api/users/{id}/summary 안에 일부 신뢰 요약이 포함되어 있었다.

변경 후 구현:
GET /api/users/{id}/trust-summary가 현재 신뢰 요약값을 독립적으로 반환한다.

호환성:
기존 API는 변경하지 않는다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/services/UserService.ts
src/controllers/user.controller.ts
src/routes/users/UserRoutes.ts
src/config/swagger.ts

핵심 로직:
UserService.getTrustSummary가 사용자 존재를 확인한다.
완료 거래 수, 취소 수, 노쇼 수를 기존 테이블/이벤트에서 집계한다.
trustScore를 trustGrade, gradeLabel, badges로 변환한다.

새로 추가된 모델/서비스/라우트:
GET /api/users/{id}/trust-summary
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/users/{id}/trust-summary

요청 변경:
없음

응답 변경:
TrustSummaryResponse 스키마를 추가한다.

프론트엔드 수정 필요 여부:
신뢰 카드 단독 렌더링이 필요한 화면은 신규 API를 호출할 수 있다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
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
trustScore
trustGrade
gradeLabel
rankPercent
completedTradeCount
responseRate
avgResponseMinutes
cancelCount
noShowCount
badges

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
GET /api/users/{id}/trust-summary

주의할 상태값:
rankPercent와 avgResponseMinutes는 현재 별도 랭킹/응답시간 데이터가 없어 추정값이다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
curl -s "http://localhost:3000/api/users/{id}/trust-summary"
```

## 10. 남은 작업

```text
후속 API:
실제 응답 시간 기반 avgResponseMinutes 계산
사용자 분포 기반 rankPercent 계산

운영/배포 주의점:
DB 변경은 없다.

테스트 보강:
신뢰 이벤트 유무에 따른 집계 결과 테스트를 추가할 수 있다.

문서 보강:
랭킹/응답시간 정책 확정 시 계산 기준 문서를 업데이트한다.
```
