import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const appEnvPath = path.resolve(moduleDir, "../../../apps/web/.env");

dotenv.config({ path: appEnvPath });
dotenv.config();

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1).optional(),
    LEGACY_SQLITE_URL: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    OPENROUTER_MODEL: z.string().min(1).optional(),
    EVALUATION_V2_ENABLED: z.enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
