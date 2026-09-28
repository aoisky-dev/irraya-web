import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function productCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const link = container.resolve("link")
  const query = container.resolve("query")
  
  try {
    // Check if product already has a shipping profile linked
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "shipping_profile.*"],
      filters: { id: data.id }
    })
    
    if (products[0]?.shipping_profile) {
      return // Already has a profile
    }

    const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
    const profiles = await fulfillmentModule.listShippingProfiles({ type: "default" })
    
    if (profiles.length > 0) {
      // Link the product to the default shipping profile
      await link.create({
        [Modules.PRODUCT]: {
          product_id: data.id,
        },
        [Modules.FULFILLMENT]: {
          shipping_profile_id: profiles[0].id,
        },
      })
      console.log(`[Auto-Link] Assigned product ${data.id} to default shipping profile.`)
    }
  } catch (error) {
    console.error(`Failed to assign default shipping profile for product ${data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created"],
}
