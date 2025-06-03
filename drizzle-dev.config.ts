import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "./.dev.vars" });

export default defineConfig({
  schema: "./src/worker/db/schema.ts",
  out: "./.drizzle-out",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  verbose: true,
  breakpoints: true,
  strict: true,
});
