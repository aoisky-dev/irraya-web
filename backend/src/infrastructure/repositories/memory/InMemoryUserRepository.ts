import { User } from "../../../domain/users/User.js";
import { UserRepository } from "../../../domain/users/UserRepository.js";

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  constructor(initialUsers: User[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.id, user);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }
}
