const normalizeUrl = (value: string): string => value.replace(/\/+$/, "");
const envValue = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const firstNonEmpty = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
};

const publishableKey = firstNonEmpty(
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY,
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  process.env.MEDUSA_PUBLISHABLE_API_KEY,
  process.env.MEDUSA_PUBLISHABLE_KEY
);

export const config = {
  storeName: envValue(process.env.NEXT_PUBLIC_STORE_NAME, "Irraya Fashion"),
  medusaBaseUrl: normalizeUrl(envValue(process.env.NEXT_PUBLIC_MEDUSA_BASE_URL, "http://localhost:9000")),
  medusaPublishableApiKey: publishableKey,
  medusaAdminUrl: envValue(process.env.NEXT_PUBLIC_MEDUSA_ADMIN_URL, "http://localhost:9000/app")
};
