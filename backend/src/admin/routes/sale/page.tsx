import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button, Input, Label, Switch, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Sale = {
  id: number
  name: string
  active: boolean
  discountPct: number
  label?: string
  productIds: string[]
}

type MedusaProduct = {
  id: string
  title: string
  thumbnail?: string
  handle?: string
}

// ---------------------------------------------------------------------------
// Product search modal
// ---------------------------------------------------------------------------
function ProductPicker({
  onAdd,
  onClose,
  assignedIds,
}: {
  onAdd: (product: MedusaProduct) => void
  onClose: () => void
  assignedIds: string[]
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const url = query.trim()
          ? `/admin/products?q=${encodeURIComponent(query)}&limit=20`
          : "/admin/products?limit=20"
        const res = await fetch(url)
        const data = await res.json()
        setResults(data.products || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        background: "var(--color-bg-base)", borderRadius: 12, padding: 24,
        width: "100%", maxWidth: 520, maxHeight: "80vh",
        display: "flex", flexDirection: "column", gap: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div className="flex items-center justify-between">
          <Heading level="h2">Add Products to Sale</Heading>
          <Button variant="transparent" size="small" onClick={onClose}>✕</Button>
        </div>
        <Input
          placeholder="Search products…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <Text size="small" className="text-ui-fg-subtle">Searching…</Text>
          ) : results.length === 0 ? (
            <Text size="small" className="text-ui-fg-subtle">No products found.</Text>
          ) : results.map(p => {
            const already = assignedIds.includes(p.id)
            return (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 8,
                background: "var(--color-bg-subtle)",
                opacity: already ? 0.5 : 1,
              }}>
                <div className="flex items-center gap-3">
                  {p.thumbnail && (
                    <img src={p.thumbnail} alt={p.title} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />
                  )}
                  <Text size="small" weight="plus">{p.title}</Text>
                </div>
                {already ? (
                  <Badge color="grey">Added</Badge>
                ) : (
                  <Button size="small" onClick={() => onAdd(p)}>Add</Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single sale card
// ---------------------------------------------------------------------------
function SaleCard({
  sale,
  onUpdate,
  onDelete,
  onAssignProducts,
  onRemoveProduct,
}: {
  sale: Sale
  onUpdate: (id: number, patch: Partial<Sale>) => void
  onDelete: (id: number) => void
  onAssignProducts: (saleId: number, products: MedusaProduct[]) => void
  onRemoveProduct: (saleId: number, productId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(sale.name)
  const [discountPct, setDiscountPct] = useState(sale.discountPct)
  const [label, setLabel] = useState(sale.label ?? "")
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [products, setProducts] = useState<MedusaProduct[]>([])

  // Load product titles for assigned products
  useEffect(() => {
    if (sale.productIds.length === 0) { setProducts([]); return }
    fetch(`/admin/products?id[]=${sale.productIds.join("&id[]=")}`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
  }, [sale.productIds.join(",")])

  const saveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/store/sales/${sale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, discountPct, label: label || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      onUpdate(sale.id, data.sale)
      setEditing(false)
      toast.success("Sale updated")
    } catch (err: any) {
      toast.error(err?.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (checked: boolean) => {
    try {
      const res = await fetch(`/admin/store/sales/${sale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: checked }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      onUpdate(sale.id, { active: checked })
      toast.success(checked ? "Sale activated" : "Sale deactivated")
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle")
    }
  }

  const handleAddProducts = async (newProducts: MedusaProduct[]) => {
    const ids = newProducts.map(p => p.id)
    try {
      const res = await fetch(`/admin/store/sales/${sale.id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      if (data.alreadyInOtherSale?.length > 0) {
        toast.warning(`${data.alreadyInOtherSale.length} product(s) already assigned to another sale and were skipped.`)
      }
      onAssignProducts(sale.id, newProducts.filter(p => data.assigned?.includes(p.id)))
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign products")
    }
  }

  const removeProduct = async (productId: string) => {
    try {
      await fetch(`/admin/store/sales/${sale.id}/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [productId] }),
      })
      onRemoveProduct(sale.id, productId)
    } catch {
      toast.error("Failed to remove product")
    }
  }

  const exampleOriginal = 4500
  const exampleSale = sale.active && sale.discountPct > 0
    ? Math.round(exampleOriginal * (1 - sale.discountPct / 100))
    : null

  return (
    <>
      {showPicker && (
        <ProductPicker
          assignedIds={sale.productIds}
          onAdd={p => handleAddProducts([p])}
          onClose={() => setShowPicker(false)}
        />
      )}
      <Container>
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {editing ? (
                <Input value={name} onChange={e => setName(e.target.value)} className="w-48" />
              ) : (
                <Heading level="h2">{sale.name}</Heading>
              )}
              <Badge color={sale.active ? "green" : "grey"}>
                {sale.active ? "Active" : "Inactive"}
              </Badge>
              <Badge color="grey">{sale.productIds.length} product{sale.productIds.length !== 1 ? "s" : ""}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sale.active} onCheckedChange={toggleActive} />
              <Button size="small" variant="secondary" onClick={() => setEditing(!editing)}>
                {editing ? "Cancel" : "Edit"}
              </Button>
              <Button size="small" variant="danger" onClick={() => onDelete(sale.id)}>Delete</Button>
            </div>
          </div>

          {/* Edit fields */}
          {editing && (
            <div className="flex flex-col gap-3 bg-ui-bg-subtle rounded-lg p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <Label htmlFor={`pct-${sale.id}`}>Discount %</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`pct-${sale.id}`}
                      type="number" min={0} max={100} step={0.5}
                      value={discountPct}
                      onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Text>%</Text>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Label htmlFor={`lbl-${sale.id}`}>Label (optional)</Label>
                  <Input
                    id={`lbl-${sale.id}`}
                    placeholder={`${discountPct || 10}% OFF`}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              {discountPct > 0 && exampleSale && (
                <div className="flex items-center gap-2">
                  <Text size="small" weight="plus">Preview:</Text>
                  <Text size="small" className="text-ui-fg-error">₹{exampleSale.toLocaleString("en-IN")}</Text>
                  <Text size="small" className="line-through text-ui-fg-subtle">₹{exampleOriginal.toLocaleString("en-IN")}</Text>
                  <Badge color="red">{label || `${discountPct}% OFF`}</Badge>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={saveEdit} isLoading={saving}>Save changes</Button>
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Text size="small" weight="plus">Assigned Products</Text>
              <Button size="small" variant="secondary" onClick={() => setShowPicker(true)}>+ Add products</Button>
            </div>
            {sale.productIds.length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle">No products assigned. Add products to activate this sale on specific listings.</Text>
            ) : (
              <div className="flex flex-col gap-2">
                {products.map(p => (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8, background: "var(--color-bg-subtle)",
                  }}>
                    <div className="flex items-center gap-2">
                      {p.thumbnail && (
                        <img src={p.thumbnail} alt={p.title} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
                      )}
                      <Text size="small">{p.title}</Text>
                    </div>
                    <Button size="small" variant="transparent" onClick={() => removeProduct(p.id)}>Remove</Button>
                  </div>
                ))}
                {/* Show IDs for any products not yet resolved */}
                {sale.productIds
                  .filter(id => !products.find(p => p.id === id))
                  .map(id => (
                    <div key={id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 8, background: "var(--color-bg-subtle)",
                    }}>
                      <Text size="small" className="text-ui-fg-subtle">{id}</Text>
                      <Button size="small" variant="transparent" onClick={() => removeProduct(id)}>Remove</Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SalePage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPct, setNewPct] = useState(10)
  const [newLabel, setNewLabel] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchSales = async () => {
    try {
      const res = await fetch("/admin/store/sales")
      const data = await res.json()
      setSales(data.sales || [])
    } catch {
      toast.error("Failed to load sales")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSales() }, [])

  const createSale = async () => {
    if (!newName.trim()) { toast.error("Sale name is required"); return }
    setSaving(true)
    try {
      const res = await fetch("/admin/store/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), discountPct: newPct, label: newLabel || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSales(prev => [data.sale, ...prev])
      setCreating(false)
      setNewName(""); setNewPct(10); setNewLabel("")
      toast.success("Sale created")
    } catch (err: any) {
      toast.error(err?.message || "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = (id: number, patch: Partial<Sale>) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/admin/store/sales/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setSales(prev => prev.filter(s => s.id !== id))
      toast.success("Sale deleted")
    } catch {
      toast.error("Failed to delete sale")
    }
  }

  const handleAssignProducts = (saleId: number, products: MedusaProduct[]) => {
    setSales(prev => prev.map(s => s.id === saleId
      ? { ...s, productIds: [...new Set([...s.productIds, ...products.map(p => p.id)])] }
      : s
    ))
  }

  const handleRemoveProduct = (saleId: number, productId: string) => {
    setSales(prev => prev.map(s => s.id === saleId
      ? { ...s, productIds: s.productIds.filter(id => id !== productId) }
      : s
    ))
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex items-start justify-between">
        <div>
          <Heading level="h1">Sales</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Create named sales and assign specific products. A product can only belong to one sale at a time.
          </Text>
        </div>
        <Button onClick={() => setCreating(true)}>+ New Sale</Button>
      </div>

      {/* Create form */}
      {creating && (
        <Container>
          <Heading level="h2" className="mb-4">New Sale</Heading>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="new-name">Sale Name</Label>
              <Input id="new-name" placeholder="e.g. Diwali Sale" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" />
            </div>
            <div className="flex gap-4 flex-wrap">
              <div>
                <Label htmlFor="new-pct">Discount %</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input id="new-pct" type="number" min={0} max={100} step={0.5} value={newPct} onChange={e => setNewPct(parseFloat(e.target.value) || 0)} className="w-24" />
                  <Text>%</Text>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Label htmlFor="new-label">Label (optional)</Label>
                <Input id="new-label" placeholder={`${newPct}% OFF`} value={newLabel} onChange={e => setNewLabel(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={createSale} isLoading={saving}>Create Sale</Button>
            </div>
          </div>
        </Container>
      )}

      {/* Sales list */}
      {loading ? (
        <Container><Text className="text-ui-fg-subtle">Loading…</Text></Container>
      ) : sales.length === 0 && !creating ? (
        <Container>
          <Text className="text-ui-fg-subtle">No sales yet. Create one to start discounting specific products.</Text>
        </Container>
      ) : (
        sales.map(sale => (
          <SaleCard
            key={sale.id}
            sale={sale}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAssignProducts={handleAssignProducts}
            onRemoveProduct={handleRemoveProduct}
          />
        ))
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Sales",
  icon: Tag,
})
