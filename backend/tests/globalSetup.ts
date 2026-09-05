import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

// The test DB lives next to schema.prisma so `file:./test.db` in .env.test
// resolves the same way `file:./dev.db` does for the dev server.
const BACKEND_DIR = resolve(__dirname, '..');
const TEST_DB = resolve(BACKEND_DIR, 'prisma/test.db');
const TEST_DB_JOURNAL = `${TEST_DB}-journal`;
const TEST_DB_URL = 'file:./test.db';

function removeTestDb() {
  for (const f of [TEST_DB, TEST_DB_JOURNAL]) {
    if (existsSync(f)) rmSync(f, { force: true });
  }
}

// Runs once before the whole suite.
export async function setup() {
  removeTestDb(); // start from a guaranteed-clean slate every run
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: BACKEND_DIR,
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'ignore',
  });
}

// Runs once after the whole suite — the shared dev.db is never involved, and the
// throwaway test.db is deleted so `npm test` leaves zero artifacts behind.
export async function teardown() {
  removeTestDb();
}
