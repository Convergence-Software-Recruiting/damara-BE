// src/services/UserService.ts

import { UserRepo } from "../repos/UserRepo";
import { UserCreationAttributes } from "../models/User";
import {
  EmailAlreadyExistsError,
  RouteError,
  InvalidCredentialsError,
  StudentIdAlreadyExistsError,
} from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import bcrypt from "bcrypt";
import { TrustService } from "./TrustService";

export const UserService = {
  /**
   * 회원가입 기능
   * - Service는 DB 또는 HTTP를 몰라야 한다
   * - 순수 비즈니스 로직만 처리 (중복 체크, 비밀번호 해싱)
   */
  async registerUser(data: UserCreationAttributes) {
    // 1) 이메일 중복 검사
    const emailExists = await UserRepo.findByEmail(data.email);
    if (emailExists) {
      throw new EmailAlreadyExistsError();
    }

    // 2) 학번 중복 검사
    const studentIdExists = await UserRepo.findByStudentId(data.studentId);
    if (studentIdExists) {
      throw new StudentIdAlreadyExistsError();
    }

    // 3) 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.passwordHash, 10);

    // 4) UserRepo를 통해 회원 생성
    const user = await UserRepo.create({
      ...data,
      passwordHash: hashedPassword,
    });

    return TrustService.withTrustGrade(user);
  },

  /**
   * 이메일로 사용자 조회 (로그인 시 사용 가능)
   */
  async getUserByEmail(email: string) {
    const user = await UserRepo.findByEmail(email);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }
    return user;
  },

  /**
   * 부분 업데이트
   */
  async updateUser(id: string, patch: Partial<UserCreationAttributes>) {
    const user = await UserRepo.update(id, patch);
    return TrustService.withTrustGrade(user);
  },

  /**
   * 삭제
   */
  async deleteUser(id: string) {
    await UserRepo.delete(id);
  },

  /**
   * 전체 조회 + pagination
   */
  async listUsers(limit = 20, offset = 0) {
    const users = await UserRepo.list(limit, offset);
    return users.map((user) => TrustService.withTrustGrade(user));
  },

  /**
   * 학번과 비밀번호로 로그인
   */
  async loginByStudentId(studentId: string, password: string) {
    // 1) 학번으로 사용자 찾기
    const user = await UserRepo.findByStudentId(studentId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2) 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 3) 비밀번호 해시는 제외하고 반환
    const { passwordHash, ...userWithoutPassword } = user;
    return TrustService.withTrustGrade(userWithoutPassword);
  },

  /**
   * 내부 신뢰점수 업데이트
   * @param userId 사용자 ID
   * @param scoreChange 점수 변화량 (양수: 증가, 음수: 감소)
   */
  async updateTrustScore(userId: string, scoreChange: number) {
    const event = await TrustService.applyEvent({
      userId,
      type: "manual_adjustment",
      scoreChange,
      reason: "UserService.updateTrustScore legacy adjustment",
    });

    return event.nextScore;
  },

  /**
   * 사용자 ID로 조회
   */
  async getUserById(id: string) {
    const user = await UserRepo.findById(id);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }
    // 비밀번호 해시 제외
    const { passwordHash, ...userWithoutPassword } = user;
    return TrustService.withTrustGrade(userWithoutPassword);
  },
};
