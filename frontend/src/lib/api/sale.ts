import { medusaRequest } from "./client";

export type SaleConfig = {
  id: number;
  name: string;
  active: boolean;
  discountPct: number;
  label?: string;
  productIds: string[];
};

/** Map from productId → SaleConfig for O(1) lookup in components */
export type SaleMap = Record<string, SaleConfig>;

export async function getSales(): Promise<SaleConfig[]> {
  try {
    const res = await medusaRequest<{ sales?: SaleConfig[] }>("/store/sales");
    return res.sales ?? [];
  } catch {
    return [];
  }
}

export function buildSaleMap(sales: SaleConfig[]): SaleMap {
  const map: SaleMap = {};
  for (const sale of sales) {
    for (const productId of sale.productIds ?? []) {
      map[productId] = sale;
    }
  }
  return map;
}

// Admin APIs
export async function adminListSales(token: string): Promise<SaleConfig[]> {
  const res = await medusaRequest<{ sales?: SaleConfig[] }>("/admin/store/sales", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.sales ?? [];
}

export async function adminCreateSale(
  token: string,
  input: { name: string; discountPct: number; label?: string; active?: boolean }
): Promise<SaleConfig> {
  const res = await medusaRequest<{ sale: SaleConfig }>("/admin/store/sales", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return res.sale;
}

export async function adminUpdateSale(
  token: string,
  id: number,
  input: { name?: string; discountPct?: number; label?: string; active?: boolean }
): Promise<SaleConfig> {
  const res = await medusaRequest<{ sale: SaleConfig }>(`/admin/store/sales/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return res.sale;
}

export async function adminDeleteSale(token: string, id: number): Promise<void> {
  await medusaRequest(`/admin/store/sales/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminAssignProducts(
  token: string,
  saleId: number,
  productIds: string[]
): Promise<{ assigned: string[]; alreadyInOtherSale: string[] }> {
  return medusaRequest(`/admin/store/sales/${saleId}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productIds }),
  });
}

export async function adminRemoveProducts(
  token: string,
  saleId: number,
  productIds: string[]
): Promise<void> {
  await medusaRequest(`/admin/store/sales/${saleId}/products`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productIds }),
  });
}

// ---------------------------------------------------------------------------
// Convenience helpers for the admin sale config page
// (treats the first sale record as the global config)
// ---------------------------------------------------------------------------

/** Get the global sale config (first sale record). */
export async function adminGetSaleConfig(token: string): Promise<SaleConfig> {
  const sales = await adminListSales(token)
  if (sales.length > 0) return sales[0]
  // Return a sensible default if no sale record exists yet
  return { id: 0, name: "Global Sale", active: false, discountPct: 0, label: "", productIds: [] }
}

/** Update (or create if none exists) the global sale config. */
export async function adminSetSaleConfig(
  token: string,
  input: { active?: boolean; discountPct?: number; label?: string }
): Promise<SaleConfig> {
  const sales = await adminListSales(token)
  if (sales.length > 0) {
    return adminUpdateSale(token, sales[0].id, input)
  }
  return adminCreateSale(token, {
    name: "Global Sale",
    discountPct: input.discountPct ?? 0,
    label: input.label,
    active: input.active ?? false,
  })
}

/** Compute sale price in paise. Returns undefined if no active sale for this product. */
export function applySaleDiscount(
  priceInCents: number,
  sale: SaleConfig | null | undefined
): number | undefined {
  if (!sale || !sale.active || sale.discountPct <= 0) return undefined;
  return Math.round(priceInCents * (1 - sale.discountPct / 100));
}
