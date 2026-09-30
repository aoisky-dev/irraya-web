import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

export default function BrandedOrderIdWidget(props: any) {
  let orderRef = props?.data?.metadata?.order_ref

  if (!orderRef) {
    const raw = props?.data
    if (raw && raw.created_at) {
      const date = new Date(raw.created_at)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const idStr = String(raw.display_id || 0).padStart(5, "0")
      orderRef = `IRR-${year}${month}-${idStr}`
    }
  }

  if (!orderRef) return null

  return (
    <Container className="p-4 mb-4 flex items-center justify-between">
      <div className="flex gap-2 items-center">
        <Text size="base" weight="plus" className="text-ui-fg-subtle">
          Branded ID:
        </Text>
        <Heading level="h2">{orderRef}</Heading>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})
