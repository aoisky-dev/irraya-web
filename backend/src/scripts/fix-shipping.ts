/**
 * Fix shipping option: add a price via updateShippingOptionsWorkflow.
 * Run with: npx medusa exec src/scripts/fix-shipping.ts
 */

import { updateShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

export default async function fixShipping({ container }: { container: any }) {
  console.log("Fixing shipping option price...")

  const fulfillmentModuleService = container.resolve("fulfillment")
  const pricingModuleService = container.resolve("pricing")
  const remoteLink = container.resolve("link")

  // Check existing shipping option
  const opts = await fulfillmentModuleService.listShippingOptions({})
  console.log("Shipping options:", opts.map((o: any) => `${o.id} - ${o.name}`).join(", "))

  if (opts.length === 0) {
    console.error("No shipping options found!")
    return
  }

  const opt = opts[0]
  console.log("Fixing price for:", opt.id)

  try {
    // Use updateShippingOptionsWorkflow
    const { result } = await updateShippingOptionsWorkflow(container).run({
      input: [
        {
          id: opt.id,
          prices: [
            {
              currency_code: "inr",
              amount: 0
            }
          ]
        }
      ]
    })
    console.log("✅ Updated with price! Result:", JSON.stringify(result, null, 2).substring(0, 200))
  } catch (err: any) {
    console.error("updateShippingOptionsWorkflow error:", err?.message)
    
    // Fallback: create a price set and link it manually  
    console.log("Trying direct price set creation...")
    try {
      // Create a price set with 0 INR price
      const priceSet = await pricingModuleService.createPriceSets([{
        prices: [{ currency_code: "inr", amount: 0 }]
      }])
      const priceSetId = priceSet[0]?.id
      console.log("Created price set:", priceSetId)
      
      // Link via remote link module
      await remoteLink.create([{
        fulfillment: { shipping_option_id: opt.id },
        pricing: { price_set_id: priceSetId }
      }])
      console.log("✅ Linked price set to shipping option!")
    } catch (e2: any) {
      console.error("Direct link error:", e2?.message)
    }
  }
}
