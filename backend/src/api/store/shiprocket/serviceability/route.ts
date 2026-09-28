import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ShiprocketService from "../../../../modules/shiprocket/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve("logger")
  const shiprocketService = new ShiprocketService({ logger })

  let { pickup_postcode, delivery_postcode, weight, cod } = req.query

  // Default to warehouse pincode from env if frontend doesn't send it
  pickup_postcode = pickup_postcode || process.env.SHIPROCKET_PICKUP_PINCODE || "500016" // fallback placeholder

  if (!delivery_postcode || !weight) {
    return res.status(400).json({ message: "Missing required parameters: delivery_postcode, weight" })
  }

  try {
    const result = await shiprocketService.checkServiceability({
      pickup_postcode: String(pickup_postcode),
      delivery_postcode: String(delivery_postcode),
      weight: Number(weight),
      cod: cod === "1" || cod === "true" ? 1 : 0
    })

    return res.status(200).json(result)
  } catch (error: any) {
    logger.error(`Serviceability check failed: ${error.message}`)
    return res.status(500).json({ message: "Failed to check serviceability", error: error.message })
  }
}
