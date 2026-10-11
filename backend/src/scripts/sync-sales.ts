import { listSales, savePriceListId } from "../lib/sales-config"
import { syncSalePriceList } from "../lib/price-list-sync"

export default async function syncSales({ container }: { container: any }) {
  console.log("Starting sale price list sync...")
  const sales = await listSales()
  console.log(`Found ${sales.length} sales in database.`)

  for (const sale of sales) {
    console.log(`Syncing sale "${sale.name}" (id: ${sale.id}, active: ${sale.active}, discount: ${sale.discountPct}%, products: ${sale.productIds?.length || 0})...`)
    try {
      const priceListId = await syncSalePriceList(container, sale)
      console.log(`Result priceListId for sale ${sale.id}:`, priceListId)
      if (priceListId) {
        await savePriceListId(sale.id, priceListId)
        console.log(`Saved priceListId ${priceListId} to sale ${sale.id}`)
      }
    } catch (err: any) {
      console.error(`Error syncing sale ${sale.id}:`, err?.message || err)
    }
  }

  console.log("Sale price list sync complete!")
}
