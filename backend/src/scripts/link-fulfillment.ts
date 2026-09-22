/**
 * Link fulfillment set to stock location properly.
 * Run with: npx medusa exec src/scripts/link-fulfillment.ts
 */

import { createLocationFulfillmentSetWorkflow } from "@medusajs/medusa/core-flows"

export default async function linkFulfillment({ container }: { container: any }) {
  console.log("Linking fulfillment set to stock location via workflow...")

  try {
    const { result } = await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: "sloc_01M2FAMDM54BCCZY3ZRPJE0QJN",
        fulfillment_set_data: {
          name: "India Shipping",
          type: "shipping"
        }
      }
    })
    console.log("✅ Done! Created:", JSON.stringify(result, null, 2))
  } catch (err: any) {
    console.error("Error:", err?.message)
    throw err
  }
}
