/**
 * Seed script: creates a free "Standard Shipping" option in Medusa v2.
 * Run with: npx medusa exec src/scripts/seed-shipping.ts
 */

import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seedShipping({ container }: { container: any }) {
  console.log("Seeding shipping options...")

  const fulfillmentModuleService = container.resolve("fulfillment")
  const stockLocationModuleService = container.resolve("stock_location")

  // Get stock locations
  const stockLocations = await stockLocationModuleService.listStockLocations()
  const mainWarehouse = stockLocations[0]
  if (!mainWarehouse) {
    console.error("No stock locations found! Aborting.")
    return
  }
  console.log("Using stock location:", mainWarehouse.id, mainWarehouse.name)

  // Check for existing shipping options
  const existingOptions = await fulfillmentModuleService.listShippingOptions({})
  if (existingOptions.length > 0) {
    console.log("Shipping options already exist:", existingOptions.map((o: any) => o.name).join(", "))
    console.log("Done!")
    return
  }

  // Get/create fulfillment set
  const existingFsets = await fulfillmentModuleService.listFulfillmentSets({}, { relations: ["service_zones"] })
  console.log("Existing fulfillment sets:", existingFsets.length)

  let fsetId: string
  let serviceZoneId: string

  if (existingFsets.length > 0) {
    fsetId = existingFsets[0].id
    const existingZone = existingFsets[0]?.service_zones?.[0]

    if (existingZone) {
      serviceZoneId = existingZone.id
      console.log("Using existing service zone:", serviceZoneId)
    } else {
      const zones = await fulfillmentModuleService.createServiceZones([{
        name: "India",
        fulfillment_set_id: fsetId,
        geo_zones: [{ type: "country", country_code: "in" }]
      }])
      serviceZoneId = zones[0].id
      console.log("Created service zone:", serviceZoneId)
    }
  } else {
    const fsets = await fulfillmentModuleService.createFulfillmentSets([{
      name: "India Shipping",
      type: "shipping"
    }])
    fsetId = fsets[0].id
    console.log("Created fulfillment set:", fsetId)

    await stockLocationModuleService.createStockLocationFulfillmentSets([{
      stock_location_id: mainWarehouse.id,
      fulfillment_set_id: fsetId
    }])
    console.log("Linked to stock location")

    const zones = await fulfillmentModuleService.createServiceZones([{
      name: "India",
      fulfillment_set_id: fsetId,
      geo_zones: [{ type: "country", country_code: "in" }]
    }])
    serviceZoneId = zones[0].id
    console.log("Created service zone:", serviceZoneId)
  }

  // Link fulfillment provider to the fulfillment set location
  console.log("Linking provider to fulfillment set...")
  try {
    await fulfillmentModuleService.upsertFulfillmentSets([{
      id: fsetId,
    }])
  } catch (e) {
    console.log("Upsert note:", e)
  }

  // Link manual_manual provider to the stock location
  try {
    await stockLocationModuleService.updateStockLocations(mainWarehouse.id, {
      metadata: { provider_linked: true }
    })
  } catch (e) {
    console.log("Stock location update note:", e)
  }

  // Create the free shipping option using the workflow
  console.log("Creating shipping option with service_zone_id:", serviceZoneId)
  try {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Shipping",
          service_zone_id: serviceZoneId,
          shipping_profile_id: "sp_01M2166CGWA10JNX5CTXPZXJ8S",
          data: {},
          price_type: "flat",
          provider_id: "manual_manual",
          type: {
            label: "Standard",
            description: "Standard free shipping",
            code: "standard",
          },
          prices: [
            {
              currency_code: "inr",
              amount: 0,
            },
          ],
          rules: [
            {
              attribute: "is_return",
              operator: "eq",
              value: "false",
            },
          ],
        },
      ],
    })
    console.log("✅ Successfully created free Standard Shipping option!")
  } catch (err: any) {
    console.error("createShippingOptionsWorkflow error:", err?.message)

    // Fallback: create directly via service
    console.log("Trying direct creation via fulfillment service...")
    const opts = await fulfillmentModuleService.createShippingOptions([{
      name: "Standard Shipping",
      service_zone_id: serviceZoneId,
      shipping_profile_id: "sp_01M2166CGWA10JNX5CTXPZXJ8S",
      provider_id: "manual_manual",
      data: {},
      price_type: "flat",
      type: {
        label: "Standard",
        description: "Standard free shipping",
        code: "standard",
      },
      prices: [{ currency_code: "inr", amount: 0 }],
      rules: [{ attribute: "is_return", operator: "eq", value: "false" }],
    }])
    console.log("✅ Created via direct service:", opts[0]?.id)
  }
}
