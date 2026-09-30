import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button, Input, Label, Switch, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type SaleConfig = {
  active: boolean
  discountPct: number
  label?: string
}

export default function SalePage() {
  const [sale, setSale] = useState<SaleConfig>({ active: false, discountPct: 0, label: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/admin/store/sale")
      .then((r) => r.json())
      .then((data) => setSale({ ...data.sale, label: data.sale?.label ?? "" }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/admin/store/sale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: sale.active,
          discountPct: sale.discountPct,
          label: sale.label || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to save")
      setSale({ ...data.sale, label: data.sale?.label ?? "" })
      toast.success("Sale settings saved")
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save sale settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Text>Loading sale settings…</Text>
      </div>
    )
  }

  const exampleOriginal = 4500
  const exampleSale = sale.active && sale.discountPct > 0
    ? Math.round(exampleOriginal * (1 - sale.discountPct / 100))
    : null

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">Sale Management</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Set a global discount applied to all displayed product prices on the storefront.
            This is separate from promo codes — the discounted price shows directly on listings.
          </Text>
        </div>
        <Badge color={sale.active ? "green" : "grey"}>
          {sale.active ? "Sale Active" : "Sale Inactive"}
        </Badge>
      </div>

      <Container>
        <div className="flex flex-col gap-6">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Sale</Label>
              <Text size="small" className="text-ui-fg-subtle">
                When on, all product prices show the discounted price with the original struck through.
              </Text>
            </div>
            <Switch
              checked={sale.active}
              onCheckedChange={(checked) => setSale((s) => ({ ...s, active: checked }))}
            />
          </div>

          <div className="border-t border-ui-border-base" />

          {/* Discount % */}
          <div>
            <Label htmlFor="sale-pct">Discount Percentage</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="sale-pct"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={sale.discountPct}
                onChange={(e) => setSale((s) => ({ ...s, discountPct: parseFloat(e.target.value) || 0 }))}
                className="w-28"
              />
              <Text>%</Text>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              E.g. 10 means 10% off every product.
            </Text>
          </div>

          {/* Label */}
          <div>
            <Label htmlFor="sale-label">Sale Label <span className="text-ui-fg-subtle font-normal">(optional)</span></Label>
            <Input
              id="sale-label"
              type="text"
              placeholder={`${sale.discountPct || 10}% OFF`}
              value={sale.label ?? ""}
              onChange={(e) => setSale((s) => ({ ...s, label: e.target.value }))}
              className="mt-2"
            />
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Shown on product cards. Defaults to "{sale.discountPct || 10}% OFF" if blank.
            </Text>
          </div>

          {/* Preview */}
          {sale.discountPct > 0 && (
            <div className="bg-ui-bg-subtle rounded-lg p-4">
              <Text size="small" weight="plus">Price Preview</Text>
              {sale.active && exampleSale ? (
                <div className="flex items-center gap-2 mt-2">
                  <Text className="text-ui-fg-error font-semibold">
                    ₹{exampleSale.toLocaleString("en-IN")}
                  </Text>
                  <Text size="small" className="line-through text-ui-fg-subtle">
                    ₹{exampleOriginal.toLocaleString("en-IN")}
                  </Text>
                  <Badge color="red">{sale.label || `${sale.discountPct}% OFF`}</Badge>
                </div>
              ) : (
                <Text size="small" className="text-ui-fg-subtle mt-1">
                  ₹{exampleOriginal.toLocaleString("en-IN")} (sale not active)
                </Text>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={saving}>
              Save Sale Settings
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Sale",
  icon: Tag,
})
