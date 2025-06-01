import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import { DrizzleDBType } from "../../db";
import { User, UserCreate } from "./user.types";
import { getUtcDate } from "@/worker/helpers/date";

export class UserRepository {
  private db;

  constructor(db: DrizzleDBType) {
    this.db = db;
  }

  async create(userData: UserCreate): Promise<{ id: string }> {
    const email = userData.email?.toLowerCase() || null;
    const [user] = await this.db
      .insert(users)
      .values({
        ...userData,
        email,
      })
      .onConflictDoNothing({
        target: users.clerkId,
      })
      .returning({ id: users.id });
    return user;
  }

  async findByClerkId(clerkId: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    return user;
  }

  async linkClerkIdToUserTelegram(
    clerkId: string,
    chatTelegramId: number
  ): Promise<void> {
    await this.db
      .update(users)
      .set({ chatTelegramId, updatedAt: getUtcDate() })
      .where(eq(users.clerkId, clerkId));
  }
}
