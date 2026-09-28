import type { Order } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadPDFInvoice(order: Order, logoUrl?: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add Logo (Optional)
  // We cannot easily load remote images synchronously, so we will use text for now if logo is not provided
  // For production, you could fetch the image as blob and pass base64
  
  doc.setFontSize(22);
  doc.setTextColor(113, 33, 25); // #712119
  doc.text("IRRAYA", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Fashion", 14, 26);
  
  // Invoice title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("INVOICE", pageWidth - 14, 20, { align: "right" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Order ID: #${order.displayId || order.id}`, pageWidth - 14, 26, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - 14, 32, { align: "right" });
  doc.text(`Status: ${order.status.toUpperCase()}`, pageWidth - 14, 38, { align: "right" });

  // Addresses
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Ship To:", 14, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (order.shippingAddress) {
    const s = order.shippingAddress;
    doc.text([
      `${s.firstName || ""} ${s.lastName || ""}`,
      s.address1 || "",
      `${s.city || ""}, ${s.province || ""} ${s.postalCode || ""}`,
      s.countryCode?.toUpperCase() || ""
    ].filter(Boolean), 14, 52);
  } else {
    doc.text("N/A", 14, 52);
  }

  // Items Table
  const tableData = order.items.map(item => [
    item.title || "Product",
    item.quantity.toString(),
    `${(item.unitPriceInCents / 100).toFixed(2)} ${order.currencyCode.toUpperCase()}`,
    `${((item.unitPriceInCents * item.quantity) / 100).toFixed(2)} ${order.currencyCode.toUpperCase()}`
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [113, 33, 25] }, // Irraya brand color
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  let currentY = finalY;
  
  // Align right helper
  const rightCol = pageWidth - 14;
  const leftCol = pageWidth - 60;
  
  doc.text("Subtotal:", leftCol, currentY);
  doc.text(`${(order.totalInCents / 100).toFixed(2)} ${order.currencyCode.toUpperCase()}`, rightCol, currentY, { align: "right" });
  
  if (order.payment?.providerPaymentId) {
    currentY += 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Transaction ID: ${order.payment.providerPaymentId}`, 14, currentY);
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Thank you for shopping with Irraya.", pageWidth / 2, doc.internal.pageSize.height - 20, { align: "center" });

  // Save
  doc.save(`Invoice_${order.displayId || order.id}.pdf`);
}
