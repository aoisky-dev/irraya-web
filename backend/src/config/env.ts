import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(9000),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/irraya"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PAYMENT_PROVIDER: z.enum(["mock", "stripe"]).default("mock")
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(process.env);

