import { defineConfig } from 'vitest/config';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load .env.test so the whole suite runs against a throwaway SQLite DB and never
// touches dev.db. Fall back to safe defaults if the file is missing.
const testEnv = loadEnv({ path: resolve(__dirname, '.env.test') }).parsed ?? {};

export default defineConfig({
  test: {
    // Inject the test env into every worker BEFORE any module (app.ts / prisma)
    // is imported. dotenv.config() inside app.ts will not override these.
    env: {
      DATABASE_URL: testEnv.DATABASE_URL || 'file:./test.db',
      JWT_SECRET: testEnv.JWT_SECRET || 'peoplepay360-super-secret-jwt-key-2026-hackathon',
      RESEND_API_KEY: testEnv.RESEND_API_KEY || '',
      NODE_ENV: 'test',
    },
    // Prepares (and tears down) the isolated test DB schema.
    globalSetup: ['./tests/globalSetup.ts'],
    // DB-backed suites share one SQLite file — run files serially to avoid
    // write-lock contention and cross-file ordering surprises.
    fileParallelism: false,
    hookTimeout: 30000,
  },
});
