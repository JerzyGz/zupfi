import { getUtcDate } from "@/worker/helpers/date";
import { UserRepository } from "./user.repository";
import { UserCreatePayload } from "./user.types";

interface UserLinkedSuccess {
  success: true;
  userId: string;
  name: string;
}

interface UserLinkedFailure {
  success: false;
  reason:
    | "USER_WEB_NOT_FOUND"
    | "USER_ALREADY_LINKED"
    | "INVALID_CREDENTIALS"
    | "UNKNOWN_ERROR";
}

type UserLinkedResult = UserLinkedSuccess | UserLinkedFailure;

export class UserService {
  private authRepository: UserRepository;
  constructor(authRepository: UserRepository) {
    this.authRepository = authRepository;
  }

  async create(userData: UserCreatePayload): Promise<{ id: string }> {
    const date = getUtcDate();
    return this.authRepository.create({
      ...userData,
      id: crypto.randomUUID(),
      createdAt: date,
      updatedAt: date,
    });
  }

  async linkClerkIdToUserTelegram({
    clerkId,
    chatTelegramId,
  }: {
    clerkId: string;
    chatTelegramId: number;
  }): Promise<UserLinkedResult> {
    if (!clerkId || !clerkId.trim()) {
      return { success: false, reason: "INVALID_CREDENTIALS" };
    }

    try {
      const user = await this.authRepository.findByClerkId(clerkId);
      console.log("User:", user);
      if (!user) {
        return { success: false, reason: "USER_WEB_NOT_FOUND" };
      }
      if (user.chatTelegramId) {
        return { success: false, reason: "USER_ALREADY_LINKED" };
      }

      await this.authRepository.linkClerkIdToUserTelegram(
        clerkId,
        chatTelegramId
      );

      return { success: true, userId: user.id, name: user.name || "" };
    } catch {
      return { success: false, reason: "UNKNOWN_ERROR" };
    }
  }

  async findByClerkId(id: string) {
    return this.authRepository.findByClerkId(id);
  }
}
