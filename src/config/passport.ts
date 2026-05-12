import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
// KakaoStrategy 타입은 커스텀 선언(src/types/passport-kakao.d.ts)으로 any와 유사하게 사용
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { Strategy: KakaoStrategy } = require("passport-kakao");
import bcrypt from "bcrypt";
import logger from "jet-logger";
import { UserService } from "../services/UserService";
import { UserRepo } from "../repos/UserRepo";
import ENV from "../common/constants/ENV";
import { TrustService } from "../services/TrustService";

/**
 * Passport Local Strategy
 * ---------------------------------------------------------------------------
 * - 기존 학번 로그인 로직(loginByStudentId)을 최대한 재사용한다.
 * - 입력 필드: studentId, password
 * - 성공 시: 세션에 user.id를 저장하고, req.user에 사용자 정보가 올라간다.
 */

passport.use(
  new LocalStrategy(
    {
      usernameField: "studentId",
      passwordField: "password",
      session: true,
    },
    async (studentId, password, done) => {
      try {
        // 기존 서비스 로직 재사용 (비밀번호 검증 포함)
        const userWithoutPassword = await UserService.loginByStudentId(
          studentId,
          password
        );
        return done(null, userWithoutPassword);
      } catch (error) {
        // 자격 증명 오류는 false로 처리하여 실패 플로우로 보낸다.
        return done(null, false, {
          message: "학번 또는 비밀번호를 확인해주세요.",
        });
      }
    }
  )
);

/**
 * Kakao OAuth Strategy
 * ---------------------------------------------------------------------------
 * - 카카오 계정으로 최초 로그인 시 users 테이블에 자동 가입
 * - studentId는 kakao_{kakaoId} 형식의 가상 학번으로 저장
 * - 비밀번호 해시는 카카오 로그인 전용 랜덤 값으로 채운다.
 */
// 카카오 전략 설정 전에 사용할 값 로깅
const kakaoCallbackUrl = ENV.KakaoCallbackUrl;
logger.info(`[Kakao Strategy] ClientID: ${ENV.KakaoClientId}`);
logger.info(`[Kakao Strategy] CallbackURL: ${kakaoCallbackUrl}`);

passport.use(
  new KakaoStrategy(
    {
      clientID: ENV.KakaoClientId,
      callbackURL: kakaoCallbackUrl,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: (error: unknown, user?: unknown) => void
    ) => {
      try {
        const kakaoId = profile.id;
        const kakaoAccount = (profile as any)._json?.kakao_account ?? {};
        const email =
          kakaoAccount.email || `${kakaoId}@kakao-users.damara.local`;
        const nickname =
          (profile as any).username ||
          profile.displayName ||
          kakaoAccount.profile?.nickname ||
          "카카오사용자";

        const pseudoStudentId = `kakao_${kakaoId}`;

        // 1) 이미 카카오로 가입된 사용자 존재 여부 확인 (studentId 기준)
        let user = await UserRepo.findByStudentId(pseudoStudentId);

        // 2) 없으면 새 사용자 생성
        if (!user) {
          const randomPassword = await bcrypt.hash(
            `${kakaoId}_${Date.now()}`,
            10
          );

          user = await UserRepo.create({
            email,
            passwordHash: randomPassword,
            nickname,
            studentId: pseudoStudentId,
            department: null,
            avatarUrl: null,
          });
        }

        const { passwordHash, ...userWithoutPassword } = user;
        return done(null, TrustService.withTrustGrade(userWithoutPassword));
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

/**
 * 세션에 어떤 값을 저장할지 정의
 * - 여기서는 사용자 UUID(id)만 저장
 */
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

/**
 * 세션에서 사용자 정보 복원
 * - DB에서 전체 사용자 정보를 다시 읽어온다.
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserRepo.findById(id);
    if (!user) {
      return done(null, false);
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return done(null, TrustService.withTrustGrade(userWithoutPassword));
  } catch (error) {
    return done(error as Error);
  }
});

export default passport;
