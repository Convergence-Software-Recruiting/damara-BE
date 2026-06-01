# 기본 공지사항 데이터 기능 개발 보고서

## 1. 작업 시점

```text
2026-06-01
브랜치: feature/default-service-notices
관련 커밋: <Feat> 기본 공지사항 데이터 추가
```

## 2. 문제 배경

```text
기존 문제:
공지사항 API와 notices 테이블은 존재하지만 운영 DB에 공지 데이터가 없으면 프론트 공지 화면이 빈 상태로 노출된다.

사용자/운영자/프론트엔드 관점의 불편:
사용자는 서비스 안내, 이용 안내, 안전 안내를 확인할 수 없고 프론트는 빈 상태 UI만 처리해야 한다.

이번 작업으로 해결하려는 것:
DAMARA 공동구매 서비스에 필요한 기본 공지를 서버가 자동으로 제공하게 한다.
```

## 3. 기획 방향

```text
선택한 방향:
서버 시작 시 기본 DAMARA 공지사항 8개를 title 기준으로 확인하고, 누락된 공지만 생성한다.

선택하지 않은 대안:
프론트에서 임시 공지 데이터를 하드코딩하거나 운영자가 수동으로 DB에 입력하는 방식.

선택 이유:
공지 데이터의 출처를 백엔드로 일원화하고 운영 DB가 비어 있어도 API 응답이 안정적으로 유지되기 때문이다.
```

## 4. 기존 구현과 비교

```text
기존 구현:
공지 목록/상세 API는 있었지만 초기 데이터 보정 로직이 없었다.

변경 후 구현:
서버 시작 시 DAMARA 기본 공지 누락분을 자동 생성한다.
공지 응답에는 프론트 표시용 category를 포함한다.

호환성:
기존 요청 URL과 query는 유지한다.
기존 summary/type 필드는 유지하고 category만 추가한다.
```

## 5. 코드 변경 요약

```text
주요 변경 파일:
src/data/default-notices.ts
src/app.ts
src/services/NoticeService.ts
src/routes/notices/NoticeRoutes.ts
src/config/swagger.ts

핵심 로직:
DEFAULT_SERVICE_NOTICES를 기준으로 notices 테이블의 기존 title을 조회하고 누락된 기본 공지만 bulkCreate한다.
NoticeService는 summary가 있으면 category로 사용하고 없으면 type 라벨로 대체한다.

새로 추가된 모델/서비스/라우트:
신규 모델/서비스/라우트 없음.
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API:
GET /api/notices
GET /api/notices/{id}

요청 변경:
없음

응답 변경:
Notice 응답에 category 필드 추가

프론트엔드 수정 필요 여부:
공지 목록/상세에서 category를 표시하면 된다.

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
category

숨겨야 할 필드:
없음

요청 payload 변경:
없음

호출 URL 변경:
없음

주의할 상태값:
type은 service, event, maintenance, policy 중 하나이고 category는 화면 표시용 한글 라벨이다.
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
운영자 공지 등록/수정/삭제 API가 필요하면 별도 작업으로 추가한다.

운영/배포 주의점:
기본 공지는 title 기준으로 중복을 방지한다. 이미 같은 제목의 공지가 있으면 새로 만들지 않는다.

테스트 보강:
공지 seed 로직과 category fallback에 대한 단위 테스트를 추가할 수 있다.

문서 보강:
배포 후 Swagger 화면에서 Notice category 예시를 확인한다.
```
