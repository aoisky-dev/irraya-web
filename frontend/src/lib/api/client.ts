import { config } from "../config";

export class ApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}

// Singleton logout callback — set by AuthProvider on mount so medusaRequest
// can trigger logout when a 401 is received (expired token).
let _onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void): void {
  _onUnauthorized = fn
}

export async function medusaRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.medusaBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(config.medusaPublishableApiKey
        ? { "x-publishable-api-key": config.medusaPublishableApiKey }
        : {}),
      ...(init?.headers ?? {})
    },
    cache: init?.cache ?? (init?.next ? undefined : "no-store")
  });

  if (!response.ok) {
    const reason = await response.text();
    let message = reason;

    try {
      const parsed = reason ? JSON.parse(reason) as { message?: unknown; error?: unknown; type?: unknown } : null;
      const parsedMessage = typeof parsed?.message === "string" ? parsed.message : typeof parsed?.error === "string" ? parsed.error : "";
      message = parsedMessage || reason;
    } catch {
      // Keep plain-text response body.
    }

    // Auto-logout on 401 — token expired or invalidated
    if (response.status === 401 && _onUnauthorized) {
      _onUnauthorized();
    }

    throw new ApiError(message || "Medusa request failed", response.status);
  }

  return (await response.json()) as T;
}


