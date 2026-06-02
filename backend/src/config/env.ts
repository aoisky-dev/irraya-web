import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PAYMENT_PROVIDER: z.enum(["mock", "stripe"]).default("mock"),
  STORAGE_MODE: z.enum(["memory", "postgres"]).default("memory"),
  CORS_ORIGIN: z.string().default("http://localhost:3000")
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(process.env);
