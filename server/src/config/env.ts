import { z } from 'zod';
import dotenv from 'dotenv';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  HELIUS_API_KEY: z.string().min(1),
  ADMIN_KEYPAIR_JSON: z.string().min(1),
  AGENT_KEYPAIR_JSON: z.string().min(1),
  ADMIN_API_KEY: z.string().min(1),
  PRIVY_APP_ID: z.string().min(1),
  PRIVY_APP_SECRET: z.string().min(1),
  TXLINE_BASE_URL: z.string().url().default('https://txline.txodds.com'),
  TXLINE_JWT: z.string().min(1),
  TXLINE_API_TOKEN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
  if (_env) return _env;

  dotenv.config();
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`Environment validation failed:\n${formatted}`);
    process.exit(1);
  }

  _env = result.data;
  return _env;
}

export function env(): Env {
  if (!_env) {
    throw new Error('env() called before loadEnv(). Call loadEnv() in server.ts before importing modules.');
  }
  return _env;
}