import { users } from "@/worker/db/schema";

export type User = typeof users.$inferSelect;

export type UserCreatePayload = Omit<typeof users.$inferInsert, 'id' | "active" | 'createdAt' | "updatedAt">;

export type UserCreate = typeof users.$inferInsert;