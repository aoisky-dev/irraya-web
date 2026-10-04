import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "email", "created_at", "metadata", 
      "summary.*",
      "shipping_address.*",
      "items.*", 
      "items.item.*",
      "fulfillments.*",
      "fulfillments.items.*"
    ],
    filters: { display_id: 6 },
  });
  res.json(orders[0] || { error: "not found" });
}
