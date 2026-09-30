import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
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

/**
 * Generate a branded, human-friendly order reference.
 * Format: IRR-YYYYMM-NNNNN (e.g. IRR-202609-00042)
 * - Brand prefix makes it instantly recognisable in support conversations
 * - YYYYMM groups orders by month without exposing a global counter
 * - Zero-padded display_id keeps it short and speakable
 */
function buildOrderRef(displayId: number | undefined, createdAt: string): string {
  const date = new Date(createdAt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const seq = displayId ? String(displayId).padStart(5, "0") : "00000"
  return `IRR-${year}${month}-${seq}`
}

// ---------------------------------------------------------------------------
// order.placed → email customer + admin
// ---------------------------------------------------------------------------
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderEventData>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "total", "created_at", "metadata", "items.*", "customer.*"],
    filters: { id: data.id },
  })
  const order = orders?.[0]
  if (!order) return

  // Generate and persist a branded order reference if not already set
  const existingRef = (order as any).metadata?.order_ref as string | undefined
  const orderRef = existingRef || buildOrderRef(order.display_id, (order as any).created_at || new Date().toISOString())
  if (!existingRef) {
    try {
      const orderService = container.resolve(Modules.ORDER)
      await orderService.updateOrders(order.id, {
        metadata: { ...((order as any).metadata || {}), order_ref: orderRef }
      })
    } catch (err) {
      console.warn("[order-notifications] Failed to persist order_ref:", err)
    }
  }

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
    orderRef,
    items,
    totalInPaise,
  })

  const adminTpl = orderPlacedAdminTemplate({
    orderId: order.id,
    orderRef,
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

