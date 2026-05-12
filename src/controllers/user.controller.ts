/**
 * User Controller
 * ---------------------------------------------------------------------------
 * 컨트롤러는 "HTTP 레이어"만 담당한다.
 * 1) 요청 Payload를 파싱/검증하고
 * 2) Service에게 비즈니스 로직을 위임한 뒤
 * 3) HTTP Status + JSON 형태로 응답을 만든다.
 *
 * 에러 처리는 next(error)로 넘겨 app.ts에 정의한 전역 에러 핸들러가 수행.
 */
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { TrustService } from "../services/TrustService";
import { parseReq } from "../routes/common/validation/parseReq";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import {
  createUserSchema,
  CreateUserReq,
  updateUserSchema,
  UpdateUserReq,
  loginSchema,
  LoginReq,
} from "../routes/common/validation/user-schemas";

/**
 * 회원가입
 * POST /api/users
 * body: { user: {...} }
 *
 * - 요청 본문을 Zod Schema로 검증
 * - UserService.registerUser 호출
 * - 생성된 사용자 정보를 201 상태와 함께 반환
 */
export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedData = parseReq<CreateUserReq>(createUserSchema)(req.body);
    const { user } = validatedData;

    const createdUser = await UserService.registerUser(user);

    res.status(HttpStatusCodes.CREATED).json(createdUser);
  } catch (error) {
    // 에러를 전역 에러 핸들러로 전달
    // server.ts의 에러 핸들러가 RouteError를 자동으로 처리함

    //원래는 에러를 다 잡아줬어야했는데, if(error instanceof RouteError) 이렇게 처리해줬어야했음
    //이렇게 하면 전역 에러 핸들러에서 자동으로 처리됨..
    next(error);
  }
}

/**
 * 사용자 전체 조회
 * GET /api/users
 *
 * - paging 파라미터 확장이 필요하면 querystring을 파싱해서
 *   UserService.listUsers(limit, offset)에 넘기면 된다.
 */
export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await UserService.listUsers();
    res.status(HttpStatusCodes.OK).json(users);
  } catch (error) {
    next(error);
  }
}

/**
 * 회원 정보 수정
 * PUT /api/users/:id
 * body: { user: { ...patch } }
 *
 * - path param으로 대상 id 추출
 * - patch 데이터는 optional 필드만 허용(Zod)
 * - Service.updateUser가 RouteError를 던지면 전역 핸들러가 처리
 */
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const validatedData = parseReq<UpdateUserReq>(updateUserSchema)(req.body);
    const { user } = validatedData;

    const updatedUser = await UserService.updateUser(id, user);

    res.status(HttpStatusCodes.OK).json(updatedUser);
  } catch (error) {
    next(error);
  }
}

/**
 * 회원 삭제
 * DELETE /api/users/:id
 *
 * - soft delete 없이 실제 레코드 삭제
 * - 성공 시 204 No Content
 */
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    await UserService.deleteUser(id);

    res.status(HttpStatusCodes.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
}

/**
 * 학번 로그인
 * POST /api/users/login
 * body: { studentId, password }
 *
 * - StudentId/Password 조합 검증
 * - 비밀번호 해시 제거 후 응답
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = parseReq<LoginReq>(loginSchema)(req.body);
    const { studentId, password } = validatedData;

    const user = await UserService.loginByStudentId(studentId, password);

    res.status(HttpStatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자 신뢰 이벤트 이력 조회
 * GET /api/users/:id/trust-events
 *
 * - 사용자의 신뢰점수가 왜 바뀌었는지 이력을 반환
 * - previousGrade/nextGrade는 화면 표시용 신뢰학점
 */
export async function getUserTrustEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;

    const result = await TrustService.listEventsByUserId(id, limit, offset);

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 사용자 정보 조회
 * GET /api/users/:id
 *
 * - 비밀번호 해시 제거 후 응답
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    res.status(HttpStatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
}
