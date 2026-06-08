export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "admin" | "customer";
  createdAt: Date;
}

export type SafeUser = Omit<User, "passwordHash">;
