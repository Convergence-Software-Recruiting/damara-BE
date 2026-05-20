# FAQ API 기능 개발 보고서

## 1. 작업 시점

```text
2026-05-20
브랜치: feature/faqs-api
관련 커밋: 작업 후 기록
```

## 2. 문제 배경

```text
기존 문제:
마이페이지 FAQ 화면을 채울 백엔드 API가 없어 프론트엔드 임시 데이터에 의존하고 있었다.

사용자/운영자/프론트엔드 관점의 불편:
FAQ 문구를 서버 기준으로 관리할 수 없고, 카테고리별 질문/답변 목록을 실제 데이터로 연결할 수 없다.

이번 작업으로 해결하려는 것:
faqs 테이블과 FAQ 목록 조회 API를 추가한다.
```

## 3. 기획 방향

```text
선택한 방향:
GET /api/faqs를 추가한다.
FAQ 카테고리는 trade, account, payment, pickup, etc로 제한한다.
사용자 화면에는 isActive=true인 FAQ만 반환한다.

선택하지 않은 대안:
FAQ 작성/수정/삭제 관리자 API는 이번 작업에 포함하지 않는다.
공지사항 notices 테이블과 FAQ를 한 테이블로 합치지 않는다.

선택 이유:
프론트 요구사항의 우선순위는 FAQ 화면 조회이며, 관리자 권한/운영툴 설계는 별도 작업으로 분리하는 편이 안전하다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
FAQ 도메인 모델, 테이블, API가 없었다.

변경 후 구현:
faqs 테이블을 추가한다.
GET /api/faqs로 활성 FAQ 목록을 조회한다.
category 쿼리로 FAQ 카테고리를 필터링한다.

호환성:
기존 API는 변경하지 않는다.
FAQ 데이터가 없으면 목록은 빈 배열과 total=0을 반환한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/types/faq.ts
src/models/Faq.ts
src/repos/FaqRepo.ts
src/services/FaqService.ts
src/controllers/faq.controller.ts
src/routes/faqs/FaqRoutes.ts
src/routes/index.ts
src/common/constants/Paths.ts
src/app.ts
src/config/swagger.ts

핵심 로직:
FaqService가 페이지네이션과 category 필터를 정규화한다.
잘못된 category는 INVALID_FAQ_CATEGORY 400으로 처리한다.
서버 시작 시 faqs 테이블을 확인하고 없으면 생성한다.

새로 추가된 모델/서비스/라우트:
FaqModel
FaqRepo
FaqService
GET /api/faqs
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/faqs

요청 변경:
신규 목록 API는 limit, offset, category 쿼리를 받는다.

응답 변경:
Faq, FaqListResponse 스키마를 추가한다.

프론트엔드 수정 필요 여부:
FAQ 화면은 신규 API를 호출하면 된다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 있음
신규 테이블: faqs
신규 컬럼:
id
category
question
answer
sort_order
is_active
created_at
updated_at

변경된 관계:
없음

마이그레이션 필요 여부:
운영 DB에 faqs 테이블 생성 필요

ERD 변경 이력 문서:
docs/architecture/ERD_CHANGELOG.md
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
category
question
answer
order
isActive

숨겨야 할 필드:
사용자 화면에서는 isActive=false FAQ가 내려오지 않는다.

요청 payload 변경:
없음

호출 URL 변경:
FAQ 목록: GET /api/faqs
FAQ 카테고리 필터: GET /api/faqs?category=trade

주의할 상태값:
category는 trade, account, payment, pickup, etc 중 하나다.
```

## 9. 검증 방법

```bash
npm run build
npm run openapi:generate
npm run openapi:lint
curl -s "http://localhost:3000/api/faqs"
curl -s "http://localhost:3000/api/faqs?category=trade"
curl -s "http://localhost:3000/api/faqs?category=invalid"
```

## 10. 남은 작업

```text
후속 API:
관리자용 FAQ 작성/수정/삭제 API

운영/배포 주의점:
운영 DB에 faqs 테이블이 없으면 서버 시작 보정 로직이 생성한다.

테스트 보강:
FAQ 목록 정렬, category 필터, 400 응답 테스트를 추가할 수 있다.

문서 보강:
관리자 권한 정책이 정해지면 별도 기능 보고서를 추가한다.
```
