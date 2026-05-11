/* eslint-disable n/no-process-env */

import { NodeEnvs } from ".";
import { z } from "zod";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

/******************************************************************************
                                 Setup
******************************************************************************/

// 현재 실행 환경
const NODE_ENV = process.env.NODE_ENV ?? "development";

// dist/src 기준 → ../.. = /home/ubuntu/damara-BE
// 실제 프로젝트 root를 바라보도록 수정
const rootDir = path.resolve(__dirname, "../..");

// dotenv가 탐색할 경로들
const candidateEnvPaths = [
  path.join(rootDir, "config", `.env.${NODE_ENV}`),
  path.join(rootDir, `.env.${NODE_ENV}`),
  path.join(rootDir, ".env"),
];

let envLoaded = false;

// 파일 존재하면 해당 경로의 env 파일을 읽음
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

// 그래도 못 찾으면 기본 dotenv 동작
if (!envLoaded) {
  dotenv.config();
}

// Zod로 환경 변수 검증
const envSchema = z.object({
  NODE_ENV: z
    .enum([NodeEnvs.Dev, NodeEnvs.Test, NodeEnvs.Production])
    .default(NodeEnvs.Dev),

  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_PORT: z.coerce.number().int().positive().optional().default(3306),

  API_BASE_URL: z.string().url().optional(),
  ADMIN_USER_IDS: z.string().optional().default(""),
  DB_FORCE_SYNC: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  KAKAO_CLIENT_ID: z.string().min(1, "KAKAO_CLIENT_ID is required"),
  KAKAO_CALLBACK_URL: z.string().url().optional().default("http://localhost:3000/auth/kakao/callback"),
});

// 실제 환경 변수 파싱
const parsed = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,

  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,

  API_BASE_URL: process.env.API_BASE_URL,
  ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
  DB_FORCE_SYNC: process.env.DB_FORCE_SYNC,

  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID,
  KAKAO_CALLBACK_URL: process.env.KAKAO_CALLBACK_URL,
});

// 최종 ENV 객체
const ENV = {
  NodeEnv: parsed.NODE_ENV,
  Port: parsed.PORT,

  DbHost: parsed.DB_HOST,
  DbUser: parsed.DB_USER,
  DbPassword: parsed.DB_PASSWORD,
  DbName: parsed.DB_NAME,
  DbPort: parsed.DB_PORT,

  ApiBaseUrl: parsed.API_BASE_URL || `http://localhost:${parsed.PORT}`,
  AdminUserIds: parsed.ADMIN_USER_IDS.split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  DbForceSync: parsed.DB_FORCE_SYNC ?? false,

  KakaoClientId: parsed.KAKAO_CLIENT_ID,
  KakaoCallbackUrl: parsed.KAKAO_CALLBACK_URL,
};

/******************************************************************************
                            Export default
******************************************************************************/

export default ENV;

export type AppEnv = typeof ENV;
