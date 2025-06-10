import { eq } from "drizzle-orm";
import { user } from "../../db/schema";
import { DrizzleDBType } from "../../db";
import { User, UserCreate } from "./user.types";
// import { getUtcDate } from "@/worker/helpers/date";

export class UserRepository {
  private db;

  constructor(db: DrizzleDBType) {
    this.db = db;
  }

  async create(userData: UserCreate): Promise<{ id: string }> {
    const email = userData.email.toLowerCase();
    const [userCreated] = await this.db
      .insert(user)
      .values({
        ...userData,
        email,
      })
      .onConflictDoNothing({
        target: user.id,
      })
      .returning({ id: user.id });
    return userCreated;
  }

  async findById(id: string): Promise<User | undefined> {
    const [usr] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return usr;
  }

  async linkUserIdToUserTelegram(
    id: string,
    chatTelegramId: number
  ): Promise<void> {
    await this.db.update(user).set({ chatTelegramId }).where(eq(user.id, id));
  }
}
