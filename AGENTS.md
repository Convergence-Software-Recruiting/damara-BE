# DAMARA Codex 작업 하네스

이 파일은 DAMARA 백엔드 저장소에서 Codex가 따라야 하는 작업 규칙이다.

## 커밋 규칙

1. 커밋은 기능 단위로 잘게 쪼갠다.
2. 서로 다른 성격의 변경은 한 커밋에 섞지 않는다.
   - 모델/DB 변경
   - 서비스 로직 변경
   - API/Swagger 변경
   - 문서 변경
   - 배포/운영 설정 변경
3. 커밋 메시지는 다음 형식을 사용한다.

```text
<Feat> 한국말 메시지
```

예시:

```text
<Feat> 신뢰 이벤트 모델 추가
<Feat> 신뢰학점 응답 필드 추가
<Feat> Swagger 변경 이력 문서화
```

4. 커밋 전에는 가능하면 `npm run build`를 실행한다.
5. 빌드를 실행하지 못했으면 최종 답변에 이유를 남긴다.

## API/Swagger/ERD 변경 기록

프론트엔드 동료 개발자가 API 계약 변경을 추적할 수 있어야 한다.

다음 변경이 있으면 반드시 문서에 기록한다.

1. 요청 바디 변경
2. 응답 필드 추가/삭제/의미 변경
3. status code 변경
4. 신규 API 추가
5. 기존 API 삭제 또는 path 변경
6. Swagger/OpenAPI 스키마 변경
7. 테이블, 컬럼, 관계, enum 등 ERD에 해당하는 DB 구조 변경

기록 위치:

```text
docs/SWAGGER_CHANGELOG.md
docs/ERD_CHANGELOG.md
```

`docs/ERD_CHANGELOG.md`가 없으면 DB 구조 변경 작업에서 새로 만든다.

## 개발 보고서 규칙

각 기능 개발은 `docs/` 아래에 배경과 기획 의도를 남긴다.

보고서에는 최소한 다음 내용이 있어야 한다.

1. 작업 시점
2. 문제 배경
3. 기획 방향
4. 현재 구현과 비교한 변경점
5. 코드 변경 요약
6. API/Swagger 영향
7. ERD/DB 영향
8. 프론트엔드 영향
9. 검증 방법
10. 남은 작업

새 문서를 만들 때는 다음 템플릿을 사용한다.

```text
docs/templates/DEVELOPMENT_REPORT_TEMPLATE.md
```

## 작업 흐름

기능 개발 시 기본 순서는 다음과 같다.

1. 현재 구현을 먼저 읽는다.
2. 변경 범위를 작게 나눈다.
3. 코드 변경을 한다.
4. Swagger/ERD 변경 여부를 확인한다.
5. 관련 docs를 업데이트한다.
6. 빌드 또는 테스트를 실행한다.
7. 변경 성격에 따라 커밋을 쪼갠다.

## 현재 저장소 주의점

1. `npm install`이 peer dependency 충돌을 낼 수 있으므로 필요하면 `npm install --legacy-peer-deps`를 사용한다.
2. 배포 환경에서는 Express가 직접 HTTPS를 처리하지 않고 Nginx가 TLS termination을 담당한다.
3. `trustScore`는 내부 정책 점수이고, 사용자에게는 `trustGrade`를 우선 표시한다.
