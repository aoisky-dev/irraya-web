import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { sendMail } from "../lib/mailer"
import { orderCancelledTemplate } from "../lib/email-templates"

export default async function orderCancelledNotificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER)
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["customer"],
  })
  if (!order) return

  const email = order.email || (order as any).customer?.email
  if (!email) return

  const customerName = (order as any).customer
    ? [(order as any).customer.first_name, (order as any).customer.last_name].filter(Boolean).join(" ")
    : undefined

  const metadata = (order.metadata || {}) as Record<string, any>
  const refundInitiated = !!metadata?.razorpay?.refund_id

  const tpl = orderCancelledTemplate({
    name: customerName,
    email,
    orderId: order.id,
    displayId: order.display_id,
    totalInPaise: Math.round((order.total || 0) * 100),
    refundInitiated,
  })

  await sendMail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch((err) =>
    console.error("[order-cancelled-notification] Failed to send email:", err)
  )
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
