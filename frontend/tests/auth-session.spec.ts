import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST, GET, DELETE } from "../src/app/api/auth/session/route";
import { NextRequest } from "next/server";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

describe("Auth Session Route Handler (/api/auth/session)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets httpOnly session cookie on valid POST", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ token: "jwt_token_abc123" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "irraya_session",
      "jwt_token_abc123",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });

  it("returns 400 when token is missing in POST", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain("Token is required");
  });

  it("returns authenticated: true and token on GET when cookie exists", async () => {
    mockCookieStore.get.mockReturnValue({ value: "jwt_token_abc123" });

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      authenticated: true,
      token: "jwt_token_abc123",
    });
  });

  it("returns authenticated: false on GET when cookie is absent", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      authenticated: false,
      token: null,
    });
  });

  it("clears httpOnly session cookie on DELETE", async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "irraya_session",
      "",
      expect.objectContaining({
        httpOnly: true,
        maxAge: 0,
      })
    );
  });
});
