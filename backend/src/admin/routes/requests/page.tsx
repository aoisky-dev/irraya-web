import { defineRouteConfig } from "@medusajs/admin-sdk"
import { InformationCircleSolid } from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button, Select, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type RequestStatus = "requested" | "under_review" | "approved" | "rejected" | "refunded" | "completed"
type RequestType = "cancel" | "exchange" | "return"

type OrderRequest = {
  id: number
  order_id: string
  request_type: RequestType
  status: RequestStatus
  reason: string
  notes?: string
  created_at: string
  updated_at: string
}

const STATUS_COLOR: Record<RequestStatus, "green" | "red" | "orange" | "blue" | "grey"> = {
  requested: "orange",
  under_review: "blue",
  approved: "green",
  rejected: "red",
  refunded: "green",
  completed: "green",
}

const TYPE_LABEL: Record<RequestType, string> = {
  cancel: "Cancellation",
  exchange: "Exchange",
  return: "Return",
}

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All requests" },
  { value: "requested", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "refunded", label: "Refunded" },
  { value: "completed", label: "Completed" },
]

export default function RequestsPage() {
  const [requests, setRequests] = useState<OrderRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchRequests = async () => {
    try {
      const res = await fetch("/admin/customer-order-requests")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch {
      toast.error("Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/admin/customer-order-requests/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to update")
      }
      toast.success("Status updated")
      await fetchRequests()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status")
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === "requested" || r.status === "under_review").length

  return (
    <div className="flex flex-col gap-4 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Heading level="h1">Customer Requests</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Cancellation, exchange, and return requests raised by customers.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge color="orange">{pendingCount} pending</Badge>
          )}
          <Button variant="secondary" size="small" onClick={fetchRequests} isLoading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Text size="small" className="text-ui-fg-subtle whitespace-nowrap">Filter by:</Text>
        <Select value={filter} onValueChange={setFilter}>
          <Select.Trigger className="w-48">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {FILTER_OPTIONS.map(opt => (
              <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <Container>
          <Text className="text-ui-fg-subtle">Loading requests…</Text>
        </Container>
      ) : filtered.length === 0 ? (
        <Container>
          <Text className="text-ui-fg-subtle">
            {filter === "all" ? "No customer requests yet." : `No ${filter} requests.`}
          </Text>
        </Container>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((req) => (
            <Container key={req.id}>
              <div className="flex flex-col gap-3">
                {/* Top row: type + status + date */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Text weight="plus" className="capitalize">
                      {TYPE_LABEL[req.request_type] || req.request_type} Request
                    </Text>
                    <Badge color={STATUS_COLOR[req.status] || "grey"}>
                      {req.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <Text size="small" className="text-ui-fg-subtle">
                    {new Date(req.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </Text>
                </div>

                {/* Order ID link */}
                <div className="flex items-center gap-2">
                  <Text size="small" className="text-ui-fg-subtle">Order:</Text>
                  <a
                    href={`/app/orders/${req.order_id}`}
                    className="text-ui-fg-interactive text-sm font-medium hover:underline"
                  >
                    {req.order_id}
                  </a>
                </div>

                {/* Reason + notes */}
                <div className="bg-ui-bg-subtle rounded-lg p-3 flex flex-col gap-1">
                  <Text size="small">
                    <span className="text-ui-fg-subtle">Reason: </span>
                    {req.reason}
                  </Text>
                  {req.notes && (
                    <Text size="small">
                      <span className="text-ui-fg-subtle">Notes: </span>
                      {req.notes}
                    </Text>
                  )}
                </div>

                {/* Actions for pending requests */}
                {(req.status === "requested" || req.status === "under_review") && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="small"
                      onClick={() => updateStatus(req.id, "approved")}
                      isLoading={updating === req.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => updateStatus(req.id, "under_review")}
                      isLoading={updating === req.id}
                      disabled={req.status === "under_review"}
                    >
                      Mark Under Review
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => updateStatus(req.id, "rejected")}
                      isLoading={updating === req.id}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Container>
          ))}
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Requests",
  icon: InformationCircleSolid,
})
