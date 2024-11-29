import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production"]),
    PORT: z.coerce.number().positive().max(65536),
    HOSTNAME: z.string(),
  },
  runtimeEnv: process.env,
});
