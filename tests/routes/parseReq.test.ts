import { describe, expect, it } from "vitest";
import z from "zod";
import HttpStatusCodes from "../../src/common/constants/HttpStatusCodes";
import { RouteError } from "../../src/common/util/route-errors";
import { parseReq } from "../../src/routes/common/validation/parseReq";

describe("parseReq", () => {
  it("검증 실패 시 필드별 Zod issue를 details에 담는다", () => {
    const parseUser = parseReq(
      z.object({
        user: z.object({
          id: z.string().uuid(),
          nickname: z.string().min(2),
        }),
      })
    );

    try {
      parseUser({
        user: {
          id: "not-a-uuid",
          nickname: "",
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RouteError);
      const routeError = error as RouteError;
      expect(routeError.status).toBe(HttpStatusCodes.BAD_REQUEST);
      expect(routeError.error).toBe("VALIDATION_ERROR");
      expect(routeError.details).toEqual({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ["user", "id"],
            message: expect.any(String),
          }),
          expect.objectContaining({
            path: ["user", "nickname"],
            message: expect.any(String),
          }),
        ]),
      });
    }
  });
});
