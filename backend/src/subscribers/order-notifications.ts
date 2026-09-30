import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { sendMail, ADMIN_EMAIL } from "../lib/mailer"
import { orderPlacedUserTemplate, orderPlacedAdminTemplate } from "../lib/email-templates"

type OrderEventData = { id: string }

function extractItems(order: any) {
  return (order.items || []).map((i: any) => ({
    title: i.product_title || i.title || "Item",
    quantity: i.quantity || 1,
    unitPriceInPaise: Math.round((i.unit_price || 0) * 100),
  }))
}

// ---------------------------------------------------------------------------
// order.placed → email customer + admin
// ---------------------------------------------------------------------------
export async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderEventData>) {
  const orderService = container.resolve(Modules.ORDER)
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items", "customer"],
  })
  if (!order) return

  const email = order.email || (order as any).customer?.email
  if (!email) return

  const customerName = (order as any).customer
    ? [(order as any).customer.first_name, (order as any).customer.last_name].filter(Boolean).join(" ")
    : undefined

  const items = extractItems(order)
  const totalInPaise = Math.round(Number(order.total || 0) * 100)

  const userTpl = orderPlacedUserTemplate({
    name: customerName,
    email,
    orderId: order.id,
    displayId: order.display_id,
    items,
    totalInPaise,
  })

  const adminTpl = orderPlacedAdminTemplate({
    orderId: order.id,
    displayId: order.display_id,
    customerName,
    customerEmail: email,
    items,
    totalInPaise,
  })

  await Promise.allSettled([
    sendMail({ to: email, subject: userTpl.subject, html: userTpl.html, text: userTpl.text }),
    sendMail({ to: ADMIN_EMAIL(), subject: adminTpl.subject, html: adminTpl.html, text: adminTpl.text }),
  ])
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

