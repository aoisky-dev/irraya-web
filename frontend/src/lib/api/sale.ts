import { medusaRequest } from "./client";

export type SaleConfig = {
  active: boolean;
  discountPct: number;
  label?: string;
  updatedAt?: string;
};

export async function getSaleConfig(): Promise<SaleConfig> {
  try {
    const res = await medusaRequest<{ sale?: SaleConfig }>("/store/sale");
    return res.sale ?? { active: false, discountPct: 0 };
  } catch {
    return { active: false, discountPct: 0 };
  }
}

export async function adminGetSaleConfig(token: string): Promise<SaleConfig> {
  const res = await medusaRequest<{ sale?: SaleConfig }>("/admin/store/sale", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.sale ?? { active: false, discountPct: 0 };
}

export async function adminSetSaleConfig(
  token: string,
  config: { active: boolean; discountPct: number; label?: string }
): Promise<SaleConfig> {
  const res = await medusaRequest<{ sale?: SaleConfig }>("/admin/store/sale", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(config)
  });
  return res.sale ?? config;
}

/** Compute sale price in cents. Returns undefined if no active sale. */
export function applySaleDiscount(
  priceInCents: number,
  sale: SaleConfig
): number | undefined {
  if (!sale.active || sale.discountPct <= 0) return undefined;
  return Math.round(priceInCents * (1 - sale.discountPct / 100));
}
