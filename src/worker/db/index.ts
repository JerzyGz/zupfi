import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import { Env } from "@/worker";

export type DrizzleDBType = ReturnType<typeof drizzle>;

let cacheDrizzleDB: DrizzleDBType | null = null;

export function getDrizzleDb(env: Env): DrizzleDBType {
  if (!cacheDrizzleDB) {
    cacheDrizzleDB = drizzle(
      createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
      })
    );
  }
  return cacheDrizzleDB;
}
