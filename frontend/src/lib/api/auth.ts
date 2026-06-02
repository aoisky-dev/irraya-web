import { apiRequest } from "./client";
import { User } from "../types";

export async function register(data: { email: string; passwordHash: string; firstName: string; lastName: string }): Promise<User> {
  return await apiRequest<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function login(email: string, passwordHash: string): Promise<{ token: string; user: User }> {
  return await apiRequest<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, passwordHash })
  });
}

export async function getMe(token: string): Promise<User> {
  return await apiRequest<User>('/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
