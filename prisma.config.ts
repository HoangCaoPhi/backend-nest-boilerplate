import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'src/infrastructure/persistence/prisma/schema',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
