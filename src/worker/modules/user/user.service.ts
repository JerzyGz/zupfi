import { getUtcDate } from "@/worker/helpers/date";
import { UserRepository } from "./user.repository";
import { UserCreatePayload } from "./user.types";

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
}
