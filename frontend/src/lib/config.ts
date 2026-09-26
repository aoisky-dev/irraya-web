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
  storeName: "Irraya Fashion",
  siteUrl: "https://irraya.com",
  medusaBaseUrl: "https://api.irraya.com",
  medusaPublishableApiKey: "pk_a256d78487e40d25a556864cdf4982c4c5eca64f09c0627436648e4993e798e2",
  medusaAdminUrl: "https://api.irraya.com/app",
  // Used for the product-customization contact section and the feedback widget.
  contactEmail: firstNonEmpty(process.env.NEXT_PUBLIC_CONTACT_EMAIL, "info@irraya.com"),
  contactPhone: firstNonEmpty(process.env.NEXT_PUBLIC_CONTACT_PHONE, "+91 8500365656"),
  // Digits-only phone used to build wa.me links (defaults derived from contactPhone).
  whatsAppNumber: firstNonEmpty(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "").replace(/\D/g, "") ||
    firstNonEmpty(process.env.NEXT_PUBLIC_CONTACT_PHONE, "+91 8500365656").replace(/\D/g, "")
};




