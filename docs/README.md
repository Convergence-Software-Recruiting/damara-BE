# DAMARA 문서 인덱스

DAMARA 백엔드 문서는 목적별로 폴더를 나눠 관리한다.

## 폴더 구조

```text
docs/
├── api/
│   ├── OPENAPI_TOOLING.md
│   ├── SWAGGER_CHANGELOG.md
│   └── WEBSOCKET_GUIDE.md
├── openapi/
│   └── openapi.json
├── architecture/
│   ├── DOMAIN_DESIGN.md
│   └── ERD_CHANGELOG.md
├── features/
│   ├── AVATAR_UPLOAD_FEATURE.md
│   ├── CATEGORY_FEATURE.md
│   ├── CHAT_FEATURE_ONBOARDING.md
│   └── TRUST_SCORE_FEATURE.md
└── templates/
    └── DEVELOPMENT_REPORT_TEMPLATE.md
```

## 프론트엔드 개발자가 먼저 볼 문서

API 응답, 요청, 스키마 변경을 확인하려면 다음 문서를 우선 본다.

- [Swagger/OpenAPI 변경 이력](./api/SWAGGER_CHANGELOG.md)
- [OpenAPI 도구 사용 가이드](./api/OPENAPI_TOOLING.md)
- [신뢰학점 기능 문서](./features/TRUST_SCORE_FEATURE.md)
- [WebSocket 가이드](./api/WEBSOCKET_GUIDE.md)

Swagger UI:

```text
https://damara.bluerack.org/api-docs
```

OpenAPI JSON:

```text
https://damara.bluerack.org/api-docs.json
```

## 백엔드 개발자가 먼저 볼 문서

- [도메인 설계](./architecture/DOMAIN_DESIGN.md)
- [ERD/DB 변경 이력](./architecture/ERD_CHANGELOG.md)
- [OpenAPI 도구 사용 가이드](./api/OPENAPI_TOOLING.md)
- [개발 보고서 템플릿](./templates/DEVELOPMENT_REPORT_TEMPLATE.md)

## 기능별 개발 보고서

- [아바타 업로드](./features/AVATAR_UPLOAD_FEATURE.md)
- [게시글 카테고리](./features/CATEGORY_FEATURE.md)
- [채팅 기능 온보딩](./features/CHAT_FEATURE_ONBOARDING.md)
- [OpenAPI 변경 감지 및 품질 검사 도구](./features/OPENAPI_TOOLING_FEATURE.md)
- [신뢰학점](./features/TRUST_SCORE_FEATURE.md)

## 문서 작성 규칙

1. 기능의 배경과 기획 방향은 `docs/features/`에 남긴다.
2. API 계약 변경은 `docs/api/SWAGGER_CHANGELOG.md`에 남긴다.
3. DB 구조 변경은 `docs/architecture/ERD_CHANGELOG.md`에 남긴다.
4. 새 기능 문서는 `docs/templates/DEVELOPMENT_REPORT_TEMPLATE.md`를 기준으로 작성한다.
