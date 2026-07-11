import { afterEach, describe, expect, it, vi } from "vitest";
import { changePassword, login, register } from "../src/lib/api/auth";

describe("auth registration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects passwords shorter than 8 characters", async () => {
    await expect(register({
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      passwordHash: "Pass@1"
    })).rejects.toThrow("Password must be at least 8 characters and include at least one special character.");
  });

  it("rejects passwords without a special character", async () => {
    await expect(register({
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      passwordHash: "Password123"
    })).rejects.toThrow("Password must be at least 8 characters and include at least one special character.");
  });

  it("creates a Medusa auth identity before creating the store customer", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/auth/customer/emailpass/register")) {
        return Response.json({ token: "customer-auth-token" });
      }

      if (url.endsWith("/store/customers") && init?.method === "POST") {
        return Response.json({
          customer: {
            id: "cus_123",
            email: "test@example.com",
            phone: "+919999999999",
            first_name: "Test",
            last_name: "User",
            created_at: "2026-07-11T00:00:00.000Z"
          }
        });
      }

      return new Response("Not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const user = await register({
      email: "test@example.com",
      phone: "+91 99999 99999",
      firstName: "Test",
      lastName: "User",
      passwordHash: "Password@123",
      verificationToken: "verify-token",
      verificationChannel: "email"
    });

    expect(user).toMatchObject({
      id: "cus_123",
      email: "test@example.com",
      phone: "+919999999999",
      firstName: "Test",
      lastName: "User"
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/auth/customer/emailpass/register");
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({
      email: "test@example.com",
      password: "Password@123"
    }));

    expect(String(fetchMock.mock.calls[1][0])).toBe("http://localhost:9000/store/customers");
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: "Bearer customer-auth-token"
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      phone: "+919999999999",
      metadata: {
        verification_token: "verify-token",
        verification_channel: "email"
      }
    });
  });

  it("sanitizes signup names and email before creating the customer", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/auth/customer/emailpass/register")) {
        return Response.json({ token: "customer-auth-token" });
      }

      if (url.endsWith("/store/customers") && init?.method === "POST") {
        return Response.json({
          customer: {
            id: "cus_123",
            email: "test@example.com",
            first_name: "Test User",
            last_name: "Example",
            created_at: "2026-07-11T00:00:00.000Z"
          }
        });
      }

      return new Response("Not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    await register({
      email: "  TEST@Example.COM  ",
      firstName: "  Test   User  ",
      lastName: "  Example  ",
      passwordHash: "Password@123"
    });

    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({
      email: "test@example.com",
      password: "Password@123"
    }));

    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      email: "test@example.com",
      first_name: "Test User",
      last_name: "Example"
    });
  });
});

describe("auth login errors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a friendly account error for invalid credentials", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Unauthorized" }, { status: 401 })));

    await expect(login("missing@example.com", "wrong-password")).rejects.toThrow("Account doesn't exist or password is incorrect.");
  });

  it("does not expose raw fetch failures during login", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));

    await expect(login("user@example.com", "password")).rejects.toThrow("Account doesn't exist or password is incorrect.");
  });
});

describe("change password", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects weak new passwords before making a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(changePassword({
      token: "token",
      email: "user@example.com",
      currentPassword: "Password@123",
      newPassword: "Password123"
    })).rejects.toThrow("Password must be at least 8 characters and include at least one special character.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts current and new password to the customer password endpoint", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({ message: "Password changed successfully." }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await changePassword({
      token: "customer-token",
      email: " USER@Example.COM ",
      currentPassword: "Password@123",
      newPassword: "NewPassword@123"
    });

    expect(result.message).toBe("Password changed successfully.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:9000/store/customers/me/password");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer customer-token"
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: "user@example.com",
      current_password: "Password@123",
      new_password: "NewPassword@123"
    });
  });
});

