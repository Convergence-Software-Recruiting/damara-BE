# Swagger/OpenAPI 변경 이력

이 문서는 Swagger 문서가 코드 변경과 함께 어떻게 바뀌었는지 남기는 기록이다.

Swagger는 프론트엔드와 백엔드가 API 계약을 맞추는 기준점이다. 따라서 라우트, 요청 바디, 응답 스키마, 에러 응답, 서버 URL 동작이 바뀌면 이 문서에도 변경 내용을 추가한다.

## 업데이트 원칙

Swagger 관련 변경이 생기면 다음 순서로 기록한다.

1. 변경 날짜와 브랜치를 적는다.
2. 변경 전 기준 커밋을 적는다.
3. 어떤 스키마나 엔드포인트가 바뀌었는지 적는다.
4. 프론트엔드에 영향이 있는지 적는다.
5. 배포 후 확인할 Swagger URL이나 curl 명령을 적는다.

확인 기준은 다음 파일이다.

```text
src/config/swagger.ts
src/routes/**/*.ts
```

배포 환경에서는 다음 URL로 최종 OpenAPI JSON을 확인한다.

```text
https://damara.bluerack.org/api-docs.json
```

## 2026-05-09 - 신뢰학점 스키마 반영

브랜치:

```text
feature/trust-safety-filtering
```

변경 전 기준 커밋:

```text
7e9f230
```

### 변경 요약

신뢰도 기능을 기존 `trustScore` 단일 값에서 내부 점수와 사용자 표시 학점으로 분리했다.

기존에는 Swagger의 `User` 스키마가 다음 개념만 표현했다.

```text
trustScore
= 사용자 신뢰점수
= 0~100
= 기본값 50
```

이번 변경 후에는 다음처럼 나뉜다.

```text
trustScore
= 백엔드 내부 정책 계산용 점수
= 0~100
= 기본값 50

trustGrade
= 사용자에게 보여주는 신뢰학점
= 2.5~4.5
= 기본값 3.5
```

### Swagger 스키마 변경

대상 파일:

```text
src/config/swagger.ts
```

변경된 스키마:

```text
components.schemas.User
```

변경 전 `required`:

```json
["id", "email", "nickname", "studentId", "trustScore"]
```

변경 후 `required`:

```json
["id", "email", "nickname", "studentId", "trustScore", "trustGrade"]
```

변경 전 `trustScore` 설명:

```text
신뢰점수 (0~100, 기본값: 50)
```

변경 후 `trustScore` 설명:

```text
내부 신뢰점수 (0~100, 기본값: 50)
```

추가된 필드:

```json
{
  "trustGrade": {
    "type": "number",
    "format": "float",
    "description": "사용자에게 표시하는 신뢰학점 (2.5~4.5, 기본값: 3.5)",
    "minimum": 2.5,
    "maximum": 4.5,
    "example": 3.5
  }
}
```

### API 응답 영향

`User` 스키마를 참조하는 응답에서 `trustGrade`가 함께 내려간다.

대표 영향 범위:

```text
POST /api/users
POST /api/users/login
GET /api/users
GET /api/users/{id}
PUT /api/users/{id}
OAuth 로그인/세션 사용자 응답
```

응답 예시는 다음 형태를 기준으로 한다.

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "test@mju.ac.kr",
  "nickname": "홍길동",
  "studentId": "20241234",
  "trustScore": 50,
  "trustGrade": 3.5
}
```

### 프론트엔드 영향

프론트엔드는 사용자에게 `trustScore`를 직접 보여주기보다 `trustGrade`를 표시하는 것이 맞다.

권장 표시:

```text
신뢰학점: 3.5
```

내부 관리나 정책 판단이 필요한 화면이 아니라면 `trustScore`는 숨긴다.

### 변경되지 않은 것

이번 변경에서는 Swagger에 신규 엔드포인트를 추가하지 않았다.

`trust_events` 테이블과 `TrustService`는 백엔드 내부 정책 이력 저장용으로 추가되었지만, 아직 다음 API는 만들지 않았다.

```text
GET /api/users/{id}/trust-events
PATCH /api/admin/users/{id}/trust-score
POST /api/posts/{id}/participants/{userId}/no-show
```

이 API들이 추가되면 이 문서에 별도 항목으로 기록한다.

### 확인 방법

로컬에서 빌드 확인:

```bash
npm run build
```

배포 후 Swagger JSON 확인:

```bash
curl -s https://damara.bluerack.org/api-docs.json | grep -A20 '"User"'
```

`servers` 값 확인:

```bash
curl -s https://damara.bluerack.org/api-docs.json | grep -A8 '"servers"'
```

정상 배포 상태에서는 `servers`에 HTTPS 서버가 잡혀야 한다.

```json
[
  {
    "url": "https://damara.bluerack.org",
    "description": "Current server (자동 감지)"
  }
]
```

## 다음 변경 시 기록할 후보

앞으로 신뢰/보안 기능이 확장되면 Swagger 변경 이력에 다음 항목을 추가한다.

```text
사전 약속 확인 API
노쇼 신고 API
신뢰학점 변경 이력 조회 API
관리자 신뢰도 수동 조정 API
학교 인증 단계 API
신뢰학점 기반 참여 제한/필터링 API
```
