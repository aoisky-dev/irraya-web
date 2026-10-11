import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"
import type { Sale } from "./sales-config"

/**
 * Syncs a Medusa price list for the given sale.
 *
 * - Creates a new price list if none exists yet.
 * - Replaces all prices on the existing price list if it already exists.
 * - Deletes the price list if the sale is inactive, has no products, or has 0% discount.
 *
 * Returns the Medusa price list ID (to persist), or null if the list was deleted/not created.
 */
export async function syncSalePriceList(
  container: MedusaContainer,
  sale: Sale
): Promise<string | null> {
  const pricingModule = container.resolve(Modules.PRICING)

  const shouldHaveList = sale.active && (sale.productIds?.length ?? 0) > 0 && sale.discountPct > 0

  if (!shouldHaveList) {
    if (sale.priceListId) {
      await pricingModule.deletePriceLists([sale.priceListId]).catch(() => {})
    }
    return null
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Fetch variants + their price sets for all products in the sale.
  // Medusa v2 links each variant to exactly one PriceSet via a remote link.
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "price_set.id",
      "price_set.prices.id",
      "price_set.prices.amount",
      "price_set.prices.currency_code",
      "price_set.prices.price_list_id", // null means it's a base price (not a price list price)
    ],
    filters: { product_id: sale.productIds as string[] },
  })

  const discountFactor = 1 - sale.discountPct / 100

  // Build the prices array: one discounted INR price per variant (base prices only)
  const prices: { price_set_id: string; amount: number; currency_code: string; rules: Record<string, never> }[] = []

  for (const variant of variants ?? []) {
    const priceSet = variant.price_set
    if (!priceSet) continue

    // Only consider base prices (no price_list_id = not already a price-list override)
    const baseInrPrice = priceSet.prices?.find(
      (p: any) => p.currency_code === "inr" && !p.price_list_id
    )
    if (!baseInrPrice) continue

    const discounted = Math.floor(baseInrPrice.amount * discountFactor)
    prices.push({
      price_set_id: priceSet.id,
      amount: discounted,
      currency_code: "inr",
      rules: {},
    })
  }

  if (prices.length === 0) {
    // No priceable variants — clean up any stale list
    if (sale.priceListId) {
      await pricingModule.deletePriceLists([sale.priceListId]).catch(() => {})
    }
    return null
  }

  if (sale.priceListId) {
    // Delete and recreate prices on the existing list (simplest way to avoid drift)
    try {
      const [existing] = await pricingModule.listPriceLists(
        { id: [sale.priceListId] },
        { relations: ["prices"] }
      )
      if (existing?.prices?.length) {
        await pricingModule.removePrices(existing.prices.map((p: any) => p.id))
      }
      await pricingModule.addPriceListPrices([{ price_list_id: sale.priceListId, prices }])
      // Ensure the list is active
      await pricingModule.updatePriceLists([{ id: sale.priceListId, status: "active" }])
      return sale.priceListId
    } catch {
      // If the stored list no longer exists in Medusa, fall through to create a new one
    }
  }

  // Create a fresh price list
  const [created] = await pricingModule.createPriceLists([
    {
      title: sale.label || sale.name,
      description: `${sale.discountPct}% off – managed by Irraya sale engine`,
      type: "sale",
      status: "active",
      prices,
    },
  ])

  return created.id
}
