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
    return this.authRepository.create({
      ...userData,
      id: crypto.randomUUID(),
    });
  }

  async linkUserIdToUserTelegram({
    userId,
    chatTelegramId,
  }: {
    userId: string;
    chatTelegramId: number;
  }): Promise<UserLinkedResult> {
    if (!userId || !userId.trim()) {
      return { success: false, reason: "INVALID_CREDENTIALS" };
    }

    try {
      const user = await this.authRepository.findById(userId);
      console.log("User:", user);
      if (!user) {
        return { success: false, reason: "USER_WEB_NOT_FOUND" };
      }
      if (user.chatTelegramId) {
        return { success: false, reason: "USER_ALREADY_LINKED" };
      }

      await this.authRepository.linkUserIdToUserTelegram(
        userId,
        chatTelegramId
      );

      return { success: true, userId: user.id, name: user.name || "" };
    } catch {
      return { success: false, reason: "UNKNOWN_ERROR" };
    }
  }

  async findById(id: string) {
    return this.authRepository.findById(id);
  }
}
