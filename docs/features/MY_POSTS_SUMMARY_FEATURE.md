# 내 공구 탭 요약 API 개발 보고서

## 1. 작업 시점

```text
2026-05-15
브랜치: feature/participant-status
관련 커밋: 커밋 전
```

## 2. 문제 배경

```text
기존 문제:
내 공구 화면의 등록한 공구, 참여한 공구, 관심 공구 탭은 각각 상단에 3개씩 요약 카운트를 보여준다.
기존 API만 사용하면 프론트엔드가 각 목록을 충분히 많이 가져와 직접 카운트해야 했다.

사용자/운영자/프론트엔드 관점의 불편:
화면 첫 진입에 필요한 숫자를 만들기 위해 목록 API와 클라이언트 집계 로직이 필요했다.
마감임박, 최근 추가 기준이 프론트마다 달라질 수 있었다.

이번 작업으로 해결하려는 것:
내 공구 화면 상단 카운트를 한 번에 내려주는 요약 API를 추가한다.
```

## 3. 기획 방향

```text
선택한 방향:
GET /api/users/{userId}/my-posts/summary API를 추가한다.

선택하지 않은 대안:
등록한 공구, 참여한 공구, 관심 공구 목록 API에 summary를 각각 붙이지 않는다.

선택 이유:
세 탭 상단 카운트는 같은 화면에서 함께 필요하므로 하나의 요약 API가 프론트 구현과 네트워크 호출을 줄인다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
등록한 공구는 작성자별 게시글 목록, 참여한 공구는 참여 목록, 관심 공구는 관심 목록을 각각 조회해야 했다.
상단 숫자는 프론트엔드가 직접 계산해야 했다.

변경 후 구현:
요약 API가 등록한 공구, 참여한 공구, 관심 공구 상단 카운트를 한 번에 반환한다.

호환성:
기존 목록 API는 유지된다.
요약 API는 신규 endpoint이므로 기존 클라이언트와 충돌하지 않는다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/repos/PostRepo.ts
src/repos/PostParticipantRepo.ts
src/repos/FavoriteRepo.ts
src/services/UserService.ts
src/controllers/user.controller.ts
src/routes/users/UserRoutes.ts
src/config/swagger.ts

핵심 로직:
작성자 게시글 상태 카운트, 참여 상태 카운트, 관심 공구 마감/최근 카운트를 각각 Repo에서 계산한다.
UserService.getMyPostsSummary가 세 탭 요약을 조립한다.

새로 추가된 모델/서비스/라우트:
GET /api/users/{userId}/my-posts/summary
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/users/{userId}/my-posts/summary

요청 변경:
신규 query parameter deadlineSoonHours, recentDays를 지원한다.

응답 변경:
신규 MyPostsSummary 스키마를 반환한다.

프론트엔드 수정 필요 여부:
내 공구 화면 상단 카운트는 이 API 응답으로 렌더링할 수 있다.

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
registered.inProgress
registered.deadlineSoon
registered.completed
participated.participating
participated.paymentPending
participated.pickupReady
participated.received
favorites.total
favorites.deadlineSoon
favorites.recent

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
GET /api/users/{userId}/my-posts/summary

주의할 상태값:
마감임박 기본 기준은 24시간 이내, 최근 추가 기본 기준은 7일 이내이다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
npm run openapi:diff:breaking -- /tmp/damara-openapi-participant-status.json docs/openapi/openapi.json
```

API 확인 예시:

```bash
curl -s "http://localhost:3000/api/users/{userId}/my-posts/summary"
curl -s "http://localhost:3000/api/users/{userId}/my-posts/summary?deadlineSoonHours=48&recentDays=3"
```

## 10. 남은 작업

```text
후속 API:
카드 목록과 summary를 한 번에 내려주는 BFF형 API가 필요하면 별도 endpoint로 분리한다.

운영/배포 주의점:
DB 구조 변경은 없다.

테스트 보강:
마감임박 경계값과 최근 추가 기준일 경계값을 자동화한다.

문서 보강:
프론트 구현 후 실제 표시 기준이 24시간/7일과 다르면 query 기본값 또는 정책 문서를 조정한다.
```
