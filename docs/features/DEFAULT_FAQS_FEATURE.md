# 기본 FAQ 데이터 기능 개발 보고서

## 1. 작업 시점

```text
2026-06-01
브랜치: feature/default-faqs
관련 커밋: <Feat> 기본 FAQ 데이터 추가
```

## 2. 문제 배경

```text
기존 문제:
FAQ API와 faqs 테이블은 존재하지만 운영 DB에 FAQ 데이터가 없으면 프론트 FAQ 화면이 빈 상태로 노출된다.

사용자/운영자/프론트엔드 관점의 불편:
사용자는 공동구매 참여, 수령 장소, 결제/정산, 계정 정보 같은 기본 안내를 확인할 수 없다.

이번 작업으로 해결하려는 것:
DAMARA 서비스에 필요한 기본 FAQ를 서버가 자동으로 제공하게 한다.
```

## 3. 기획 방향

```text
선택한 방향:
서버 시작 시 기본 DAMARA FAQ 11개를 question 기준으로 확인하고, 누락된 FAQ만 생성한다.

선택하지 않은 대안:
프론트에서 FAQ 문구를 하드코딩하거나 운영자가 직접 DB에 수동 입력하는 방식.

선택 이유:
FAQ 데이터의 기준을 백엔드로 모으고 운영 DB가 비어 있어도 API 응답을 안정적으로 유지하기 위해서다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
GET /api/faqs는 있었지만 초기 데이터 보정 로직이 없었다.
FAQ 데이터가 없으면 빈 배열과 total=0을 반환했다.

변경 후 구현:
서버 시작 시 기본 FAQ 누락분을 자동 생성한다.
기존 API 요청/응답 구조는 유지한다.

호환성:
기존 GET /api/faqs 호출 방식과 category 필터는 유지한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/data/default-faqs.ts
src/app.ts
src/routes/faqs/FaqRoutes.ts
src/config/swagger.ts

핵심 로직:
DEFAULT_FAQS를 기준으로 faqs 테이블의 기존 question을 조회하고 누락된 기본 FAQ만 bulkCreate한다.

새로 추가된 모델/서비스/라우트:
신규 모델/서비스/라우트 없음.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/faqs

요청 변경:
없음

응답 변경:
필드 구조 변경 없음. 운영 DB 초기 상태에서도 기본 FAQ 데이터가 응답될 수 있다.

프론트엔드 수정 필요 여부:
기존 FAQ 목록 호출을 유지하면 된다.

Swagger 변경 이력 문서:
docs/api/SWAGGER_CHANGELOG.md
```

## 7. ERD/DB 영향

```text
변경 여부: 스키마 변경 없음
신규 테이블: 없음
신규 컬럼: 없음
변경된 관계: 없음
마이그레이션 필요 여부: 없음
ERD 변경 이력 문서: 변경 없음
```

## 8. 프론트엔드 영향

```text
새로 표시할 필드:
없음

숨겨야 할 필드:
사용자 화면에서는 isActive=false FAQ가 내려오지 않는다.

요청 payload 변경:
없음

호출 URL 변경:
없음

주의할 상태값:
category는 trade, account, payment, pickup, etc 중 하나다.
```

## 9. 검증 방법

```bash
node ./node_modules/typescript/lib/tsc.js -p tsconfig.prod.json --noEmit --pretty false
TS_NODE_SWC=false node -r ts-node/register/transpile-only scripts/lint-openapi.ts docs/openapi/openapi.json
git diff --check
```

## 10. 남은 작업

```text
후속 API:
관리자용 FAQ 등록/수정/삭제 API가 필요하면 별도 작업으로 추가한다.

운영/배포 주의점:
기본 FAQ는 question 기준으로 중복을 방지한다. 이미 같은 질문의 FAQ가 있으면 새로 만들지 않는다.

테스트 보강:
FAQ seed 로직에 대한 단위 테스트를 추가할 수 있다.

문서 보강:
배포 후 Swagger 화면과 GET /api/faqs 응답을 확인한다.
```
