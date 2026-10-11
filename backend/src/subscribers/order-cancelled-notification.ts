import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendMail } from "../lib/mailer"
import { orderCancelledTemplate } from "../lib/email-templates"

export default async function orderCancelledNotificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "total",
      "metadata",
      "customer.*",
      "items.*",
      "summary.*"
    ],
    filters: { id: data.id },
  })
  const order = orders?.[0]
  if (!order) return

  const email = order.email || (order as any).customer?.email
  if (!email) return

  const customerName = (order as any).customer
    ? [(order as any).customer.first_name, (order as any).customer.last_name].filter(Boolean).join(" ")
    : undefined

  const metadata = (order.metadata || {}) as Record<string, any>
  const refundInitiated = !!metadata?.razorpay?.refund_id
  const requestedByUser = metadata?.latest_customer_request?.type === "cancel"
  const orderRef = typeof metadata?.order_ref === "string" ? metadata.order_ref : undefined

  // Medusa v2 zeroes order.total on cancellation.
  // Retrieve the true paid amount from razorpay metadata, summary, items, or raw total.
  const razorpayAmount = metadata?.razorpay?.amount ? Number(metadata.razorpay.amount) : undefined
  const summaryPaid = (order as any).summary?.paid_total ?? (order as any).summary?.original_order_total
  const summaryAmount = summaryPaid != null ? Math.round(Number(summaryPaid) * 100) : undefined
  const itemsTotal = Array.isArray(order.items)
    ? order.items.reduce((sum: number, it: any) => sum + Math.round(Number(it.unit_price || 0) * Number(it.quantity || 1) * 100), 0)
    : undefined
  const rawTotal = Math.round(Number(order.total || 0) * 100)

  const totalInPaise = razorpayAmount && razorpayAmount > 0
    ? razorpayAmount
    : summaryAmount && summaryAmount > 0
      ? summaryAmount
      : rawTotal > 0
        ? rawTotal
        : (itemsTotal ?? 0)

  const tpl = orderCancelledTemplate({
    name: customerName,
    email,
    orderId: order.id,
    orderRef,
    displayId: order.display_id,
    totalInPaise,
    refundInitiated: true, // always mention refund on cancellation
    requestedByUser,
  })

  await sendMail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch((err) =>
    console.error("[order-cancelled-notification] Failed to send email:", err)
  )
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
