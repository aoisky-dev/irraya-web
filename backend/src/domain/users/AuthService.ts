import { AppError } from "../../shared/errors/AppError.js";
import { User, SafeUser } from "./User.js";
import { UserRepository } from "./UserRepository.js";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  private sanitizeUser(user: User): SafeUser {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async register(data: { email: string; passwordHash: string; firstName: string; lastName: string }): Promise<SafeUser> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email is already registered", "EMAIL_EXISTS", 400);
    }

    const user: User = {
      id: `usr_${Date.now()}`,
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      createdAt: new Date()
    };

    await this.userRepository.save(user);
    return this.sanitizeUser(user);
  }

  async login(email: string, passwordHash: string): Promise<{ token: string; user: SafeUser }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.passwordHash !== passwordHash) {
      throw new AppError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    // Since this is a simple mock, we'll just return the user ID as a token
    const token = `mock_token_${user.id}`;
    return { token, user: this.sanitizeUser(user) };
  }

  async getMe(token: string): Promise<SafeUser> {
    if (!token.startsWith("mock_token_")) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const id = token.replace("mock_token_", "");
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }

    return this.sanitizeUser(user);
  }
}
