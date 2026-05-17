# 마이페이지 통합 요약 API 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-17
브랜치: feature/user-summary-api
관련 커밋: 작업 후 기록
```

## 2. 문제 배경

```text
기존 문제:
마이페이지 첫 화면은 사용자 프로필, 등록/참여/관심 공구 수, 채팅/알림 unread badge, 신뢰도 카드를 동시에 보여줘야 한다.
기존 API만 사용하면 프론트엔드가 여러 API를 동시에 호출하고, 일부 신뢰 요약 값은 별도로 계산해야 했다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드 초기 렌더링 로직이 복잡해지고, 화면마다 카운트 기준이 달라질 수 있다.
신뢰도 카드의 label, badge, 완료/취소/노쇼 카운트 기준을 프론트에서 임시값으로 유지해야 했다.

이번 작업으로 해결하려는 것:
마이페이지 상단 UI에 필요한 값을 GET /api/users/{id}/summary 하나로 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
마이페이지 첫 화면 전용 BFF 성격의 summary API를 Users 도메인 아래에 추가한다.
프로필, 카운트, 신뢰 요약을 하나의 응답으로 묶는다.

선택하지 않은 대안:
기존 사용자 조회 API에 모든 카운트를 추가하지 않는다.
프론트엔드가 채팅방 목록, 알림, 내 공구 요약 API를 조합해 직접 계산하게 두지 않는다.

선택 이유:
기존 사용자 조회 API는 범용 프로필 조회로 유지하고, 마이페이지 화면 계약은 별도 API로 분리하는 편이 응답 의미가 명확하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/users/{id}는 사용자 기본 정보만 반환한다.
GET /api/users/{userId}/my-posts/summary는 내 공구 탭 상단 카운트만 반환한다.
채팅 unread, 알림 unread, 신뢰 요약은 화면에서 별도 API와 임시 계산을 조합해야 했다.

변경 후 구현:
GET /api/users/{id}/summary가 user, counts, trust를 한 번에 반환한다.
counts에는 createdPostCount, participatedPostCount, favoriteCount, unreadChatCount, unreadNotificationCount가 포함된다.
trust에는 label, badges, completedTradeCount, responseRate, cancelCount, noShowCount가 포함된다.

호환성:
기존 API는 삭제하거나 응답 형태를 바꾸지 않는다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/controllers/user.controller.ts
src/routes/users/UserRoutes.ts
src/services/UserService.ts
src/services/ChatService.ts
src/repos/ChatRoomRepo.ts
src/repos/MessageRepo.ts
src/repos/PostParticipantRepo.ts
src/repos/TrustEventRepo.ts
src/config/swagger.ts

핵심 로직:
UserService.getUserSummary가 사용자 존재를 확인한 뒤 공구/참여/관심/채팅/알림/신뢰 카운트를 병렬 조회한다.
ChatService.getUnreadMessageCountByUserId는 사용자가 접근 가능한 채팅방 ID를 기준으로 unread 메시지 총합을 계산한다.
신뢰 요약은 trustScore를 trustGrade로 변환하고, 완료/취소/노쇼 이력 기반으로 label, badges, responseRate를 계산한다.

새로 추가된 모델/서비스/라우트:
신규 모델은 없다.
GET /api/users/{id}/summary 라우트를 추가했다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: GET /api/users/{id}/summary 신규 추가
요청 변경: path parameter id만 사용한다.
응답 변경: UserSummaryResponse 신규 스키마 추가
프론트엔드 수정 필요 여부: 마이페이지 첫 화면은 신규 API로 교체 가능하다.
Swagger 변경 이력 문서: docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 없음
신규 테이블: 없음
신규 컬럼: 없음
변경된 관계: 없음
마이그레이션 필요 여부: 없음
ERD 변경 이력 문서: 변경 없음
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
user.trustGrade
counts.createdPostCount
counts.participatedPostCount
counts.favoriteCount
counts.unreadChatCount
counts.unreadNotificationCount
trust.label
trust.badges
trust.completedTradeCount
trust.responseRate
trust.cancelCount
trust.noShowCount

숨겨야 할 필드:
user.email, user.passwordHash는 응답하지 않는다.

요청 payload 변경:
없음

호출 URL 변경:
마이페이지 첫 렌더링에서 GET /api/users/{id}/summary를 사용할 수 있다.

주의할 상태값:
responseRate는 별도 평균 응답시간 데이터가 아니라 완료/취소/노쇼 이력 기반 완료 거래 비율이다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
```

로컬 서버 실행 후 확인:

```bash
curl -s "http://localhost:3000/api/users/{id}/summary"
curl -s "http://localhost:3000/api-docs.json"
```

## 10. 남은 작업

```text
후속 API:
GET /api/users/{id}/trust-summary를 별도 화면용으로 분리할 수 있다.
공지사항, FAQ, 설정 API가 아직 남아 있다.

운영/배포 주의점:
DB 구조 변경은 없다.
채팅 unread 계산은 사용자가 접근 가능한 채팅방 ID를 기준으로 한다.

테스트 보강:
채팅방이 없는 사용자, 알림이 없는 사용자, 신뢰 이벤트가 없는 사용자에 대한 기본값 테스트를 추가할 수 있다.

문서 보강:
responseRate 의미가 실제 응답률로 바뀌면 필드 설명과 계산 방식을 변경해야 한다.
```
