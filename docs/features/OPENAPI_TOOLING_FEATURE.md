# OpenAPI 변경 감지 및 품질 검사 도구 개발 보고서

## 1. 작업 시점

```text
2026-05-13
브랜치: feature/api-docs-tooling
관련 커밋: 작업 전 7a8eeb8
```

## 2. 문제 배경

```text
기존 문제:
Swagger UI와 /api-docs.json은 이미 제공되지만, API 계약이 바뀌었을 때 무엇이 바뀌었는지 자동으로 확인하는 절차가 없었다.

프론트엔드 관점의 불편:
백엔드 PR마다 Swagger 화면을 직접 열어 변경 사항을 비교해야 했고, breaking change 여부를 빠르게 판단하기 어려웠다.

이번 작업으로 해결하려는 것:
OpenAPI 스냅샷을 파일로 생성하고, lint와 diff 도구를 npm script로 실행할 수 있게 한다.
```

## 3. 기획 방향

```text
선택한 방향:
기존 Swagger UI는 유지한다.
OpenAPI 품질 검사는 Spectral로 시작한다.
OpenAPI 변경 감지는 oasdiff로 시작한다.

선택하지 않은 대안:
Scalar와 Redoc UI 추가는 이번 범위에서 제외했다.
Redocly CLI는 최신 버전의 Node 요구사항이 현재 저장소의 engines 선언보다 높아 우선 제외했다.

선택 이유:
현재 팀에 가장 급한 것은 문서 UI 교체보다 API 변경 감지와 lint 자동화다.
Swagger UI는 이미 내장되어 있고, Spectral은 팀 규칙을 점진적으로 강화하기 쉽다.
```

## 4. 현재 구현과 비교한 변경점

```text
기존 구현:
/api-docs와 /api-docs.json으로 런타임 Swagger 문서를 제공했다.
OpenAPI JSON 스냅샷 파일, lint script, diff script는 없었다.

변경 후 구현:
docs/openapi/openapi.json을 생성하는 npm script를 추가했다.
Spectral lint 규칙 파일을 추가했다.
oasdiff 기반 changelog/breaking-change script를 추가했다.
OpenAPI 도구 사용 가이드를 추가했다.
```

## 5. 코드 변경 요약

```text
package.json:
openapi:generate, openapi:lint, openapi:diff, openapi:diff:breaking script 추가

scripts/export-openapi.ts:
Swagger JSDoc 기반 OpenAPI 스펙을 docs/openapi/openapi.json으로 export

.spectral.yaml:
OpenAPI 기본 lint와 DAMARA 팀 규칙 일부 추가

docs/api/OPENAPI_TOOLING.md:
도구 사용법과 API 변경 체크리스트 문서화

docs/openapi/openapi.json:
현재 OpenAPI 계약 스냅샷 추가
```

## 6. API/Swagger 영향

```text
변경 여부: 있음
영향 API: 없음
요청/응답 계약 변경: 없음
Swagger/OpenAPI 운영 방식 변경: 있음
```

기존 `/api-docs`와 `/api-docs.json`은 유지한다.

새로 추가된 `docs/openapi/openapi.json`은 PR에서 API 계약 변경을 비교하기 위한 버전 관리용 스냅샷이다.

## 7. ERD/DB 영향

```text
변경 여부: 없음
신규 테이블: 없음
신규 컬럼: 없음
마이그레이션 필요 여부: 없음
```

## 8. 프론트엔드 영향

```text
API 호출 방식 변경: 없음
응답 필드 변경: 없음
프론트엔드 확인 방식 변경: 있음
```

프론트엔드 개발자는 API 변경 PR에서 `docs/openapi/openapi.json`, `docs/api/SWAGGER_CHANGELOG.md`, oasdiff 결과를 함께 확인하면 된다.

## 9. 검증 방법

```bash
npm run openapi:generate
npm run openapi:lint
npm run openapi:diff:breaking -- docs/openapi/openapi.json docs/openapi/openapi.json
npm run build
```

## 10. 남은 작업

```text
CI 연동:
GitHub Actions가 추가되면 기준 브랜치의 OpenAPI 스냅샷과 PR 스냅샷을 자동 비교한다.

규칙 강화:
현재 Spectral 팀 규칙은 warning 중심이다.
팀 합의가 끝난 규칙은 error로 올린다.

문서 UI 개선:
Swagger UI 사용이 안정화된 뒤 Scalar 또는 Redoc 도입을 별도 브랜치에서 검토한다.
```
