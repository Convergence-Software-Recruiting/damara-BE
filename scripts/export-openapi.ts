/* eslint-disable n/no-process-env, @typescript-eslint/no-var-requires */

import fs from "fs";
import path from "path";

process.env.NODE_ENV ??= "development";
process.env.DB_HOST ??= "localhost";
process.env.DB_USER ??= "openapi";
process.env.DB_PASSWORD ??= "openapi";
process.env.DB_NAME ??= "damara_openapi";
process.env.DB_PORT ??= "3306";
process.env.KAKAO_CLIENT_ID ??= "openapi-export";
process.env.KAKAO_CALLBACK_URL ??= "http://localhost:3000/auth/kakao/callback";

const { default: swaggerSpec } = require(
  "../src/config/swagger"
) as typeof import("../src/config/swagger");

const outputPath = process.argv[2] ?? "docs/openapi/openapi.json";
const resolvedOutputPath = path.resolve(process.cwd(), outputPath);

const stableOpenApiSpec = {
  ...swaggerSpec,
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
    {
      url: "https://damara.bluerack.org",
      description: "Production server",
    },
  ],
};

fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
fs.writeFileSync(
  resolvedOutputPath,
  `${JSON.stringify(stableOpenApiSpec, null, 2)}\n`
);

console.log(`OpenAPI spec written to ${outputPath}`);
