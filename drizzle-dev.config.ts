import { defineConfig } from 'drizzle-kit';
import { getLocalD1DB } from './scripts/utils-local-db';

const localD1DB = getLocalD1DB();
if (!localD1DB) {
  process.exit(1);
}
export default defineConfig({
  schema: './src/db/schemas.ts',
  out: './.drizzle-out',
  dialect: 'sqlite',
  dbCredentials: {
    url: localD1DB,
  },
  verbose: true,
});

