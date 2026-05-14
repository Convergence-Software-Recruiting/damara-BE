# 게시글 상세 프로필 응답 확장 개발 보고서

## 1. 작업 시점

```text
2026-05-14
브랜치: feature/post-detail-profiles
관련 커밋: 작업 전 19bbe6d
```

## 2. 문제 배경

```text
기존 문제:
GET /api/posts/{id}는 게시글 상세 정보와 favoriteCount, isFavorite만 보장했다.
상세 화면에는 판매자/주최자 프로필과 참여자 프로필이 필요하지만, 기존 상세 응답만으로는 화면을 완성하기 어렵다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드는 상세 진입 후 작성자 조회, 참여자 조회, 관심 여부 조회를 별도로 조합해야 했다.
이 경우 상세 화면 초기 렌더링이 느려지고, API 호출 순서와 실패 처리를 FE가 많이 떠안게 된다.

이번 작업으로 해결하려는 것:
상세 화면에 필요한 게시글, 작성자 공개 프로필, 참여자 공개 프로필, 관심/참여 상태를 GET /api/posts/{id} 한 번으로 제공한다.
```

## 3. 기획 방향

```text
선택한 방향:
기존 GET /api/posts/{id} 응답을 상세 화면용 PostDetail 형태로 확장한다.
목록 API는 기존처럼 가볍게 유지하고, 상세 화면에서만 author와 participants를 포함한다.

선택하지 않은 대안:
GET /api/posts/{id}/detail 같은 별도 path는 만들지 않았다.
작성자와 참여자 프로필을 FE가 각각 사용자 API로 다시 조회하는 방식도 선택하지 않았다.

선택 이유:
상세 화면은 게시글과 작성자/참여자 관계를 함께 보여주는 화면이라 서버에서 조립하는 편이 FE 구현이 단순하다.
기존 상세 path를 유지하면 라우팅과 화면 전환 코드 변경이 작다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/posts/{id}는 Post 기반 상세 정보, favoriteCount, isFavorite를 반환했다.
작성자 정보는 authorId만 있었고, 참여자 정보는 별도 /api/posts/{id}/participants 호출이 필요했다.

변경 후 구현:
GET /api/posts/{id}가 author, participants, participantCount, isParticipant를 함께 반환한다.
author와 participants.user는 공개 프로필로 제한해 passwordHash, email, trustScore를 노출하지 않는다.

호환성:
기존 Post 필드는 유지한다.
기존 상세 호출 URL은 유지한다.
응답 필드가 추가되는 변경이라 기존 FE는 그대로 동작할 수 있다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/repos/PostRepo.ts
src/repos/PostParticipantRepo.ts
src/services/PostService.ts
src/controllers/post.controller.ts
src/config/swagger.ts
src/routes/posts/PostRoutes.ts

핵심 로직:
PostRepo.findDetailById에서 게시글 이미지와 작성자 공개 프로필 원천 데이터를 조회한다.
PostParticipantRepo.findProfilesByPostId에서 참여자 공개 프로필 원천 데이터를 조회한다.
PostService.getPostById에서 trustScore를 trustGrade로 변환하고, 상세 응답을 조립한다.

새로 추가된 모델/서비스/라우트:
신규 DB 모델과 라우트는 없다.
상세 조회용 Repo 메서드와 Swagger 스키마만 추가했다.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: GET /api/posts/{id}
요청 변경: 없음. 기존 x-user-id, userId는 계속 사용한다.
응답 변경: author, participants, participantCount, isParticipant 추가
프론트엔드 수정 필요 여부: 있음
Swagger 변경 이력 문서: docs/api/SWAGGER_CHANGELOG.md
```

상세 화면 호출 기준:

```text
GET /api/posts/{postId}
GET /api/posts/{postId}?userId={userId}
```

응답에서 사용할 주요 필드:

```text
상품 카드/이미지: title, price, status, category, images
장소/일정/인원: pickupLocation, deadline, currentQuantity, minParticipants
상세 설명: content
판매자 프로필: author
참여자 프로필: participants
하트 상태: isFavorite
참여 상태: isParticipant
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

기존 관계를 그대로 사용한다.

```text
posts.author_id -> users.id
post_participants.post_id -> posts.id
post_participants.user_id -> users.id
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
author.nickname
author.department
author.avatarUrl
author.trustGrade
participants[].user.nickname
participants[].user.avatarUrl
participants[].user.trustGrade
participantCount
isParticipant

숨겨야 할 필드:
상세 프로필에는 passwordHash, email, trustScore가 내려가지 않는다.
기존 User 전체 스키마를 그대로 사용자 공개 프로필 UI에 쓰지 않는다.

요청 payload 변경:
없음

호출 URL 변경:
없음

주의할 상태값:
isParticipant는 x-user-id 또는 userId가 없으면 false다.
isFavorite도 x-user-id 또는 userId가 없으면 false다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
```

로컬 서버 실행 후 확인:

```bash
curl -s "http://localhost:3000/api/posts/{postId}"
curl -s "http://localhost:3000/api/posts/{postId}?userId={userId}"
curl -s "http://localhost:3000/api-docs.json"
```

## 10. 남은 작업

```text
후속 API:
판매자 상세 프로필 화면이 별도로 생기면 GET /api/users/{id}/public-profile 같은 공개 프로필 API를 분리할 수 있다.
참여자 목록이 매우 커지면 상세 응답에는 일부만 내려주고 participants 전용 API에 pagination을 추가한다.

운영/배포 주의점:
DB 마이그레이션은 필요 없다.
상세 응답이 기존보다 커지므로 참여자가 많은 게시글은 추후 pagination 기준을 정한다.

테스트 보강:
GET /api/posts/{id} author 포함
GET /api/posts/{id} participants 포함
GET /api/posts/{id}?userId=... isParticipant 계산
공개 프로필에서 trustScore, email, passwordHash 미노출 확인

문서 보강:
프론트엔드 상세 화면 API 사용 예시를 README 또는 FE 연동 문서에 연결한다.
```
