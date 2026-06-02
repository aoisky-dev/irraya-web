export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export type SafeUser = Omit<User, "passwordHash">;
