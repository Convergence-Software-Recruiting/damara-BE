// app.ts
// -----------------------------------------------------------------------------
// Express 애플리케이션의 핵심 구성 요소 정의
// - CORS 무적 모드 적용
// -----------------------------------------------------------------------------

import express from "express";
import { Request, Response, NextFunction } from "express";
import path from "path";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import logger from "jet-logger";
import BaseRouter from "./routes";
import Paths from "./common/constants/Paths";
import HttpStatusCodes from "./common/constants/HttpStatusCodes";
import { RouteError } from "./common/util/route-errors";
import { sequelize } from "./db";
import { setupSwagger } from "./config/swagger";
import ENV from "./common/constants/ENV";
import authRouter from "./routes/auth/AuthRoutes";
import "./config/passport";

// 모든 모델을 import하여 Sequelize가 테이블을 인식하도록 함
import "./models/User";
import "./models/Post";
import "./models/PostImage";
import "./models/ChatRoom";
import "./models/Message";
import "./models/PostParticipant";

const app = express();
app.set("trust proxy", true);

/**
 * ---------------------------------------------------------------------------
 * 🔥 완전 무적 CORS 설정 (모든 브라우저 허용)
 * ---------------------------------------------------------------------------
 * - origin: 요청 보낸 origin을 그대로 허용
 * - credentials: true 허용
 * - 모든 메서드/헤더 허용
 * - OPTIONS 프리플라이트 요청 직접 처리
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // Preflight (OPTIONS) 요청은 여기서 바로 종료
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/**
 * ---------------------------------------------------------------------------
 * HTTP Request Logger (morgan)
 * ---------------------------------------------------------------------------
 */
app.use(morgan("combined")); // Apache combined log format

/**
 * ---------------------------------------------------------------------------
 * Request Debugging Middleware (모든 요청 로깅)
 * ---------------------------------------------------------------------------
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`[요청 수신] ${req.method} ${req.path}`);
  logger.info(`[요청 파라미터] ${JSON.stringify(req.params)}`);
  logger.info(`[요청 쿼리] ${JSON.stringify(req.query)}`);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.info(`[요청 바디] ${JSON.stringify(req.body)}`);
  }
  next();
});

/**
 * ---------------------------------------------------------------------------
 * Body parser
 * ---------------------------------------------------------------------------
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * ---------------------------------------------------------------------------
 * Session & Passport
 * ---------------------------------------------------------------------------
 * - 세션 기반 로그인(Local, Kakao)을 위해 express-session과 Passport를 초기화한다.
 * - 기존 /api/users/login JSON API는 그대로 두고, /auth/* 라우트에서 세션 로그인 사용.
 */
app.use(
  session({
    secret: ENV.DbName || "damara-secret", // TODO: 전용 SESSION_SECRET로 분리 추천
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1시간
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/**
 * ---------------------------------------------------------------------------
 * Static Files
 * ---------------------------------------------------------------------------
 */
app.use(express.static(path.join(__dirname, "public")));

/**
 * ---------------------------------------------------------------------------
 * Views
 * ---------------------------------------------------------------------------
 */
const viewsDir = path.join(__dirname, "views");

app.get("/users", (_: Request, res: Response) => {
  return res.sendFile("users.html", { root: viewsDir });
});

app.get("/posts", (_: Request, res: Response) => {
  return res.sendFile("posts.html", { root: viewsDir });
});

app.get("/chat", (_: Request, res: Response) => {
  return res.sendFile("chat.html", { root: viewsDir });
});

app.get("/", (_: Request, res: Response) => {
  return res.sendFile("index.html", { root: viewsDir });
});

/**
 * ---------------------------------------------------------------------------
 * Auth Routes (Passport 기반 세션 로그인)
 * ---------------------------------------------------------------------------
 * - /auth/login, /auth/logout 등의 웹 로그인 전용 라우트
 */
app.use("/auth", authRouter);

/**
 * ---------------------------------------------------------------------------
 * Database Sync Helper
 * ---------------------------------------------------------------------------
 */
export async function syncDatabase() {
  if (!ENV.DbForceSync) {
    logger.info("DB_FORCE_SYNC=false → 기존 데이터 유지");
    // force sync가 false여도 누락된 테이블은 생성하도록 alter 옵션 사용
    try {
      await sequelize.sync({ alter: true });
      logger.info("✓ 데이터베이스 테이블 동기화 완료 (alter 모드)");
    } catch (error) {
      logger.warn("데이터베이스 테이블 동기화 중 경고 발생 (무시 가능)");
      logger.warn(error, true);
    }
    return;
  }
  try {
    await sequelize.sync({ force: true });
    logger.info("✓ 데이터베이스 force sync 완료");
  } catch (error) {
    logger.err("✗ 데이터베이스 동기화 실패");
    logger.err(error, true);
    throw error;
  }
}

/**
 * ---------------------------------------------------------------------------
 * Swagger Docs
 * ---------------------------------------------------------------------------
 */
setupSwagger(app);

/**
 * ---------------------------------------------------------------------------
 * API Router
 * ---------------------------------------------------------------------------
 */
app.use(Paths.Base, BaseRouter);

// 디버깅: 등록된 라우트 확인 (서버 시작 후)
// Express의 라우트 스택을 확인하기 위해 서버 시작 후 로깅
setTimeout(() => {
  logger.info("=== 등록된 라우트 확인 ===");
  const routes: string[] = [];

  // Express 5.x의 라우트 스택 확인
  const routerStack = (app as any)._router?.stack || [];

  function extractRoutes(stack: any[], basePath: string = ""): void {
    stack.forEach((layer: any) => {
      if (layer.route) {
        // 직접 등록된 라우트
        const method = Object.keys(layer.route.methods)
          .join(", ")
          .toUpperCase();
        routes.push(`${method} ${basePath}${layer.route.path}`);
      } else if (layer.name === "router" || layer.regexp) {
        // 서브 라우터
        const regexp = layer.regexp?.source || "";
        // 정규식에서 경로 추출 (간단한 방법)
        const match = regexp.match(/\\\/([^\\\/]+)/g);
        let subPath = basePath;
        if (match) {
          const pathParts = match.map((p: string) => p.replace(/\\\//g, "/"));
          subPath = basePath + pathParts.join("");
        }

        if (layer.handle?.stack) {
          extractRoutes(layer.handle.stack, subPath);
        }
      }
    });
  }

  extractRoutes(routerStack);

  logger.info(`등록된 라우트 수: ${routes.length}`);

  // PATCH /:id/status 라우트가 있는지 확인
  const statusRoute = routes.find(
    (r) =>
      r.includes("PATCH") && (r.includes("status") || r.includes("/:id/status"))
  );
  if (statusRoute) {
    logger.info(`✓ 상태 변경 라우트 발견: ${statusRoute}`);
  } else {
    logger.warn("⚠ PATCH /:id/status 라우트를 찾을 수 없습니다.");
    logger.warn(
      "실제 요청을 보내서 테스트해보세요. 라우트는 등록되어 있을 수 있습니다."
    );
  }

  if (routes.length > 0) {
    routes.slice(0, 30).forEach((route) => logger.info(`  - ${route}`));
    if (routes.length > 30) {
      logger.info(`  ... 외 ${routes.length - 30}개 라우트`);
    }
  } else {
    logger.warn(
      "⚠ 라우트를 찾을 수 없습니다. 라우트 확인 로직에 문제가 있을 수 있습니다."
    );
  }
}, 2000); // 서버 시작 후 2초 뒤에 확인

/**
 * ---------------------------------------------------------------------------
 * Global Error Handler
 * ---------------------------------------------------------------------------
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.err(`[Unhandled Error] ${req.method} ${req.path}`);
  logger.err(err, true);

  if (err instanceof RouteError) {
    return res.status(err.status).json({
      error: err.message,
    });
  }

  return res
    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
    .json({ error: "INTERNAL_SERVER_ERROR" });
});

export default app;
