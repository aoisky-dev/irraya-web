import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"
import { getActiveSales } from "./sales-config"

/**
 * Returns the server-computed sale unit price (in rupees, same denomination
 * as Medusa's cart unit_price field) for a given variant, or null if the
 * variant's product is not in any active sale.
 *
 * This is called by the add-to-cart middleware so that prices are always
 * determined server-side — the client never sends a price.
 */
export async function getSaleUnitPrice(
  variantId: string,
  container: MedusaContainer
): Promise<number | null> {
  const sales = await getActiveSales()
  if (!sales.length) return null

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "product_id",
      "price_set.prices.id",
      "price_set.prices.amount",
      "price_set.prices.currency_code",
      "price_set.prices.price_list_id",
    ],
    filters: { id: variantId },
  })

  const variant = variants?.[0]
  if (!variant) return null

  const sale = sales.find((s) => s.productIds?.includes(String(variant.product_id)))
  if (!sale || sale.discountPct <= 0) return null

  // Only use the base INR price (exclude price-list overrides to avoid compound discounting)
  const basePrice = variant.price_set?.prices?.find(
    (p: any) => p.currency_code === "inr" && !p.price_list_id
  )?.amount

  if (!basePrice || !Number.isFinite(Number(basePrice))) return null

  return Math.floor(Number(basePrice) * (1 - sale.discountPct / 100))
}
