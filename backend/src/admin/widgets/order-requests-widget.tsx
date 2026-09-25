import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

export default function OrderRequestsWidget(props: any) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const orderId = props?.data?.id || props?.order?.id

  const fetchRequests = async () => {
    if (!orderId) {
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch(`/admin/customer-order-requests?order_id=${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (e) {
      console.error("Failed to fetch order requests", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [orderId])

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/admin/customer-order-requests/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchRequests() // Refresh list
      }
    } catch (e) {
      console.error("Failed to update status", e)
    }
  }

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <Container>
      <Heading level="h2" className="mb-4">Customer Requests</Heading>
      <div className="flex flex-col gap-4">
        {requests.map((req) => (
          <div key={req.id} className="p-4 border rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Text size="large" weight="plus" className="capitalize">{req.request_type} Request</Text>
                <Badge color={req.status === "approved" || req.status === "completed" || req.status === "refunded" ? "green" : req.status === "rejected" ? "red" : "orange"}>
                  {req.status}
                </Badge>
              </div>
              <Text size="small" className="text-ui-fg-subtle">
                {new Date(req.created_at).toLocaleDateString()}
              </Text>
            </div>
            
            <div className="mt-2 text-ui-fg-subtle">
              <Text size="small"><strong>Reason:</strong> {req.reason}</Text>
              {req.notes && <Text size="small"><strong>Notes:</strong> {req.notes}</Text>}
            </div>

            {["requested", "under_review"].includes(req.status) && (
              <div className="flex gap-2 mt-4">
                <Button size="small" variant="secondary" onClick={() => updateStatus(req.id, "approved")}>
                  Approve
                </Button>
                <Button size="small" variant="danger" onClick={() => updateStatus(req.id, "rejected")}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})
