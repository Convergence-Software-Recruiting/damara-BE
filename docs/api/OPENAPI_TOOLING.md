# OpenAPI 도구 사용 가이드

이 문서는 DAMARA 백엔드의 OpenAPI 문서 생성, 품질 검사, 변경 감지 절차를 정리한다.

## 선택한 도구

```text
Swagger UI: 이미 내장되어 있으므로 /api-docs 유지
Spectral: OpenAPI 문서 품질 검사와 팀 규칙 lint
oasdiff: 이전 OpenAPI 스냅샷과 현재 스냅샷의 변경 감지
```

Scalar와 Redoc은 이번 범위에서 제외했다. 현재 팀에는 Swagger UI가 이미 있고, 우선순위는 문서 UI 교체보다 변경 감지와 품질 검사 자동화이기 때문이다.

## OpenAPI 스냅샷 생성

```bash
npm run openapi:generate
```

위 명령은 Swagger JSDoc 기반 스펙을 다음 파일로 저장한다.

```text
docs/openapi/openapi.json
```

API 계약이 바뀌는 PR에서는 이 파일도 함께 갱신한다.

## OpenAPI 품질 검사

```bash
npm run openapi:lint
```

현재 규칙은 `.spectral.yaml`에서 관리한다.

초기 규칙은 기존 API 문서에 바로 적용하기 쉽도록 대부분 warning으로 둔다.

```text
OpenAPI 기본 규칙 검사
operation description 누락 경고
operation tags 누락 경고
path kebab-case 경고
POST/PUT/PATCH/DELETE의 4xx 응답 문서화 경고
```

팀 합의가 끝난 규칙은 warning에서 error로 올린다.

## OpenAPI 변경 감지

현재 스냅샷을 만든 뒤 이전 스냅샷과 비교한다.

```bash
npm run openapi:generate
npm run openapi:diff -- old-openapi.json docs/openapi/openapi.json
```

breaking change만 실패 처리하고 싶으면 다음 명령을 사용한다.

```bash
npm run openapi:diff:breaking -- old-openapi.json docs/openapi/openapi.json
```

PR 기준으로는 기준 브랜치의 `docs/openapi/openapi.json`과 현재 브랜치의 생성 결과를 비교하면 된다.

## API 변경 작업 체크리스트

```text
1. 라우트/Swagger JSDoc 또는 src/config/swagger.ts 수정
2. npm run openapi:generate
3. npm run openapi:lint
4. npm run openapi:diff:breaking -- <이전 스냅샷> docs/openapi/openapi.json
5. docs/api/SWAGGER_CHANGELOG.md 갱신
6. 기능 개발 보고서의 API/Swagger 영향 항목 갱신
```
