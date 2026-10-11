export function formatMoney(amountInCents: number, currencyCode: "usd" | "inr"): string {
  const locale = currencyCode === "inr" ? "en-IN" : "en-US";
  const currency = currencyCode === "inr" ? "INR" : "USD";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

