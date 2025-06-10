import { user } from "@/worker/db/schema";

export type User = typeof user.$inferSelect;

export type UserCreatePayload = Omit<
  typeof user.$inferInsert,
  "id" | "active" | "createdAt" | "updatedAt"
>;

export type UserCreate = typeof user.$inferInsert;
