import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
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

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.passwordHash, salt);

    const user: User = {
      id: `usr_${Date.now()}`,
      email: data.email,
      passwordHash: hash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "customer",
      createdAt: new Date()
    };

    await this.userRepository.save(user);
    return this.sanitizeUser(user);
  }

  async login(email: string, passwordHash: string): Promise<{ token: string; user: SafeUser }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const isMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

    return { token, user: this.sanitizeUser(user) };
  }

  async getMe(token: string): Promise<SafeUser> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new AppError("User not found", "USER_NOT_FOUND", 404);
      }

      return this.sanitizeUser(user);
    } catch (err) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }
  }
}
