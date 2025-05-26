import { drizzle } from "drizzle-orm/d1";

export type DrizzleDBType = ReturnType<typeof drizzle>;

let cacheDrizzleDB: DrizzleDBType | null = null;

export function getDrizzleDb(d1: D1Database): DrizzleDBType {
  if (!cacheDrizzleDB) {
    cacheDrizzleDB = drizzle(d1);
  }
  return cacheDrizzleDB;
}
