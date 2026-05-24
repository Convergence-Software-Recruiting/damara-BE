import { RouteError } from "../../../common/util/route-errors";
import HttpStatusCodes from "../../../common/constants/HttpStatusCodes";
import z from "zod";
/**
 * parseReq(schema)(req.body)
 *
 * - schema로 검증하고
 * - 실패하면 ValidationError 라우트 에러 throw
 * - 성공하면 타입 안전한 데이터 반환
 *
 * => 요청 body를 zod로 검증하고, 실패함현 400 에러 뎐주는 역할을함
 *
 * 
 * z.zodType<T>로 제네릭을 넣어주는 이유가 zod로 런타임에서 검증하고 나서 파싱할때 그 결과는 T여야한다
 * 따라서 return 함수의 결과도 T 타입인것
 * 
 * 참고, 런타임 : 코드가 실제로 실행될때 
 * 다시 말하면 사용자가 실제 API로 요청을 보내는 순간!
 * 
 * 브라우저에서 요청을 날리고, 서버에서 req.body를 받겠죠
 * 그 이후 parseReq 실행 (safeParse() 실행)
 * 
 * 여기서 성패가 갈리는 것. (런타임)
 * 
 * 그렇다면 컴파일 타임은 언제인가.
 * 코드를 실행하기전, TS가 코드를 읽고 타입 오류를 검사할때
 * const data = parseCreateUser(req.body); ()

    data.email      // ✔ TS가 email을 string으로 알고 있음
    data.unknownKey // ❌ TS가 “없는 프로퍼티”라고 에러 냄 (코드 실행 전)


    완전 초장기 : 컴파일 타임
    -> 뒤에 사용자와 상호작용하는게 런타임.

 */

export function parseReq<T>(schema: z.ZodType<T>) {
  return (input: unknown): T => {
    const result = schema.safeParse(input);

    if (!result.success) {
      // 디버깅을 위해 검증 실패 상세 정보 로깅
      console.error(
        "Validation Error Details:",
        JSON.stringify(result.error, null, 2)
      );
      console.error("Input received:", JSON.stringify(input, null, 2));
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "VALIDATION_ERROR",
        "VALIDATION_ERROR",
        {
          issues: result.error.issues.map((issue) => ({
            path: issue.path,
            code: issue.code,
            message: issue.message,
          })),
        }
      );
    }

    return result.data;
  };
}
