import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Switch, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

export default function ProductAutomationWidget(props: any) {
  const productId = props?.data?.id || props?.product?.id
  const [autoFulfill, setAutoFulfill] = useState(false)
  const [autoCapture, setAutoCapture] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchProduct = async () => {
    if (!productId) return
    try {
      const res = await fetch(`/admin/products/${productId}`)
      if (res.ok) {
        const data = await res.json()
        const metadata = data.product?.metadata || {}
        setAutoFulfill(metadata.auto_fulfill === "true" || metadata.auto_fulfill === true)
        
        // Auto capture should be true by default unless explicitly set to false
        const isAutoCapture = metadata.auto_capture !== "false" && metadata.auto_capture !== false
        setAutoCapture(isAutoCapture)
      }
    } catch (e) {
      console.error("Failed to fetch product metadata", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const handleToggle = async (key: "auto_fulfill" | "auto_capture", currentValue: boolean) => {
    if (!productId || updating) return
    
    setUpdating(true)
    const newValue = !currentValue
    
    try {
      // Fetch current metadata first to merge properly
      const res = await fetch(`/admin/products/${productId}`)
      const data = await res.json()
      const metadata = data.product?.metadata || {}
      
      const updateRes = await fetch(`/admin/products/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            [key]: newValue ? "true" : "false"
          }
        })
      })
      
      if (updateRes.ok) {
        if (key === "auto_fulfill") setAutoFulfill(newValue)
        if (key === "auto_capture") setAutoCapture(newValue)
        
        toast({
          title: "Success",
          description: `Updated ${key.replace("_", " ")} successfully.`,
          variant: "success",
        })
      } else {
        throw new Error("Failed to update")
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update product automation settings.",
        variant: "error",
      })
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return null

  return (
    <Container className="mb-4">
      <Heading level="h2" className="mb-4">Automation Settings</Heading>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <Text size="large" weight="plus">Auto Fulfill</Text>
            <Text size="small" className="text-ui-fg-subtle">
              Automatically create a fulfillment (and sync to Shiprocket) when an order containing this product is placed.
            </Text>
          </div>
          <Switch 
            checked={autoFulfill}
            onCheckedChange={() => handleToggle("auto_fulfill", autoFulfill)}
            disabled={updating}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Text size="large" weight="plus">Auto Capture</Text>
            <Text size="small" className="text-ui-fg-subtle">
              Automatically capture the payment for orders containing this product.
            </Text>
          </div>
          <Switch 
            checked={autoCapture}
            onCheckedChange={() => handleToggle("auto_capture", autoCapture)}
            disabled={updating}
          />
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})
