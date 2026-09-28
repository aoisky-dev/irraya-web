import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import ShiprocketService from "../../../../../modules/shiprocket/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const logger = req.scope.resolve("logger")

  try {
    const order = await orderModuleService.retrieveOrder(id)
    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    const shiprocketOrderId = order.metadata?.shiprocket_order_id as string
    if (!shiprocketOrderId) {
      return res.status(400).json({ error: "Shiprocket order not found. Fulfillment might not be created yet." })
    }

    const shiprocketService = new ShiprocketService({ logger })
    const invoiceRes = await shiprocketService.generateInvoice([shiprocketOrderId])

    if (invoiceRes && invoiceRes.is_invoice_created && invoiceRes.invoice_url) {
      return res.status(200).json({ invoice_url: invoiceRes.invoice_url })
    } else {
      return res.status(400).json({ error: "Invoice not generated yet in Shiprocket" })
    }
  } catch (error: any) {
    logger.error(`Error generating invoice: ${error.message}`)
    return res.status(500).json({ error: "Failed to generate invoice" })
  }
}
