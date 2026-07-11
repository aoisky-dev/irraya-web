import { config } from "../config";

export class ApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
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
    cache: "no-store"
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

    throw new ApiError(message || "Medusa request failed", response.status);
  }

  return (await response.json()) as T;
}


