# 공지사항 API 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-19
브랜치: feature/notices-api
관련 커밋: 작업 후 기록
```

## 2. 문제 배경

```text
기존 문제:
마이페이지/서비스 화면에서 공지사항, 이벤트, 점검, 정책 안내를 조회할 백엔드 API가 없었다.

사용자/운영자/프론트엔드 관점의 불편:
프론트엔드가 공지 데이터를 정적으로 들고 있거나 별도 배포 없이 내용을 바꾸기 어렵다.
공지 유형별 탭, 상단 고정 공지, 상세 화면을 서버 계약으로 구성할 수 없다.

이번 작업으로 해결하려는 것:
notices 테이블과 공지사항 목록/상세 조회 API를 추가한다.
```

## 3. 기획 방향

```text
선택한 방향:
GET /api/notices와 GET /api/notices/{id}를 추가한다.
공지 유형은 service, event, maintenance, policy로 제한한다.
목록은 isPinned DESC, createdAt DESC 순서로 반환한다.

선택하지 않은 대안:
공지 작성/수정/삭제 관리자 API는 이번 작업에 포함하지 않는다.
공지사항을 사용자 알림 notifications와 합치지 않는다.

선택 이유:
프론트 요구사항의 우선순위는 사용자 화면 조회이며, 관리 기능은 권한 설계가 필요하므로 별도 작업으로 분리하는 편이 안전하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
공지사항 도메인 모델, 테이블, API가 없었다.

변경 후 구현:
notices 테이블을 추가한다.
GET /api/notices로 목록을 조회한다.
GET /api/notices/{id}로 상세를 조회한다.

호환성:
기존 API는 변경하지 않는다.
공지 데이터가 없으면 목록은 빈 배열과 total=0을 반환한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/notice.ts
src/models/Notice.ts
src/repos/NoticeRepo.ts
src/services/NoticeService.ts
src/controllers/notice.controller.ts
src/routes/notices/NoticeRoutes.ts
src/routes/index.ts
src/common/constants/Paths.ts
src/app.ts
src/config/swagger.ts

핵심 로직:
NoticeService가 페이지네이션과 type 필터를 정규화한다.
잘못된 type은 INVALID_NOTICE_TYPE 400으로 처리한다.
서버 시작 시 notices 테이블을 확인하고 없으면 생성한다.

새로 추가된 모델/서비스/라우트:
NoticeModel
NoticeRepo
NoticeService
GET /api/notices
GET /api/notices/{id}
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/notices
GET /api/notices/{id}

요청 변경:
신규 목록 API는 limit, offset, type 쿼리를 받는다.

응답 변경:
Notice, NoticeListResponse 스키마를 추가한다.

프론트엔드 수정 필요 여부:
공지 목록/상세 화면은 신규 API를 호출하면 된다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: notices
신규 컬럼:
id
title
summary
content
type
is_pinned
created_at
updated_at

변경된 관계:
없음

마이그레이션 필요 여부:
운영 DB에 notices 테이블 생성 필요

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
title
summary
content
type
isPinned
createdAt

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
공지 목록: GET /api/notices
공지 상세: GET /api/notices/{id}

주의할 상태값:
type은 service, event, maintenance, policy 중 하나다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
curl -s "http://localhost:3000/api/notices"
curl -s "http://localhost:3000/api/notices?type=service"
curl -s "http://localhost:3000/api/notices?type=invalid"
curl -s "http://localhost:3000/api/notices/123e4567-e89b-12d3-a456-426614174000"
```

## 10. 남은 작업

```text
후속 API:
관리자용 공지 작성/수정/삭제 API

운영/배포 주의점:
운영 DB에 notices 테이블이 없으면 서버 시작 보정 로직이 생성한다.

테스트 보강:
공지 목록 정렬, type 필터, 404 응답 테스트를 추가할 수 있다.

문서 보강:
관리자 권한 정책이 정해지면 별도 기능 보고서를 추가한다.
```
