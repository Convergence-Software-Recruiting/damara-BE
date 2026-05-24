import fs from "fs";
import path from "path";

type OpenApiOperation = {
  summary?: string;
  description?: string;
  responses?: Record<string, unknown>;
};

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);
const HTTP_METHODS = new Set(["get", ...MUTATING_METHODS]);
const COMMON_4XX = ["400", "401", "403", "404", "409", "422"];

const inputPath = process.argv[2] ?? "docs/openapi/openapi.json";
const resolvedInputPath = path.resolve(process.cwd(), inputPath);
const spec = JSON.parse(fs.readFileSync(resolvedInputPath, "utf8"));
const issues: string[] = [];

for (const [routePath, pathItem] of Object.entries<Record<string, unknown>>(
  spec.paths ?? {}
)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!HTTP_METHODS.has(method) || !operation || typeof operation !== "object") {
      continue;
    }

    const op = operation as OpenApiOperation;
    const label = `${method.toUpperCase()} ${routePath}`;

    if (!op.description || !op.description.trim()) {
      issues.push(`${label}: operation description is required.`);
    }

    if (MUTATING_METHODS.has(method)) {
      const responses = op.responses ?? {};
      const hasCommon4xx = COMMON_4XX.some((status) => status in responses);

      if (!hasCommon4xx) {
        issues.push(`${label}: at least one common 4xx response is required.`);
      }
    }
  }
}

if (issues.length > 0) {
  console.error(`OpenAPI lint failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("OpenAPI lint passed");
