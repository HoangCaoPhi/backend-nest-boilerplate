// Creates the integration-test database (if missing) and applies migrations to it.
// Kept as a script because setting an env var inline is not portable across shells.
import { execSync } from 'node:child_process';
import 'dotenv/config';

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error('TEST_DATABASE_URL is not set — see .env.example');
  process.exit(1);
}

const database = new URL(url).pathname.slice(1);

try {
  execSync(`docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE ${database}"`, {
    stdio: 'pipe',
  });
  console.log(`created database ${database}`);
} catch {
  console.log(`database ${database} already exists`);
}

execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
