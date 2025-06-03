import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
export type DrizzleDBType = ReturnType<typeof drizzle>;

let cacheDrizzleDB: DrizzleDBType | null = null;

export function getDrizzleDb(): DrizzleDBType {
  if (!cacheDrizzleDB) {
    cacheDrizzleDB = drizzle(
      createClient({
        url: process.env.TURSO_DATABASE_URL || "file:local.db",
        authToken: process.env.TURSO_AUTH_TOKEN || undefined,
      })
    );
  }
  return cacheDrizzleDB;
}
