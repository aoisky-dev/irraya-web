import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  passwordHash: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required")
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  passwordHash: z.string().min(1, "Password is required")
});
