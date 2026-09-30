// ---------------------------------------------------------------------------
// Branded HTML email templates for Irraya.
// All templates return { subject, html, text } ready to pass to sendMail().
// ---------------------------------------------------------------------------

function inr(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN")
}

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
  body{margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);}
  .header{background:#1a1a1a;padding:28px 32px;}
  .header a{color:#fff;font-size:22px;font-weight:700;letter-spacing:.04em;text-decoration:none;}
  .body{padding:32px;}
  h1{font-size:20px;font-weight:700;margin:0 0 12px;}
  p{font-size:15px;line-height:1.6;margin:0 0 16px;color:#333;}
  .otp{display:inline-block;font-size:32px;font-weight:800;letter-spacing:.18em;color:#1a1a1a;background:#f0f0f0;padding:12px 28px;border-radius:6px;margin:8px 0 20px;}
  .btn{display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;}
  .table{width:100%;border-collapse:collapse;margin:16px 0;}
  .table td{padding:10px 0;font-size:14px;border-bottom:1px solid #f0f0f0;vertical-align:top;}
  .table td:last-child{text-align:right;font-weight:500;}
  .badge{display:inline-block;background:#f0f0f0;color:#555;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.04em;}
  .divider{border:none;border-top:1px solid #f0f0f0;margin:24px 0;}
  .footer{background:#fafafa;padding:20px 32px;font-size:12px;color:#999;text-align:center;border-top:1px solid #f0f0f0;}
  .footer a{color:#999;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><a href="https://irraya.com">Irraya</a></div>
  <div class="body">${body}</div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} Irraya. All rights reserved.<br/>
    Need help? <a href="mailto:info@irraya.com">info@irraya.com</a>
  </div>
</div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// OTP
// ---------------------------------------------------------------------------
export function otpTemplate(opts: { name?: string; email: string; code: string; expiresMinutes?: number }) {
  const name = opts.name || opts.email
  const mins = opts.expiresMinutes ?? 10

  const html = base("Verify your email — Irraya", `
    <h1>Verify your email</h1>
    <p>Hi ${name},</p>
    <p>Use the code below to verify your email address. It expires in <strong>${mins} minutes</strong>.</p>
    <div class="otp">${opts.code}</div>
    <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
  `)

  return {
    subject: `${opts.code} is your Irraya verification code`,
    html,
    text: `Your Irraya verification code is ${opts.code}. It expires in ${mins} minutes.`,
  }
}

// ---------------------------------------------------------------------------
// Order placed — customer copy
// ---------------------------------------------------------------------------
export function orderPlacedUserTemplate(opts: {
  name?: string
  email: string
  orderId: string
  orderRef?: string
  displayId?: number
  items: Array<{ title: string; quantity: number; unitPriceInPaise: number }>
  totalInPaise: number
}) {
  const ref = opts.orderRef || (opts.displayId ? `#${opts.displayId}` : opts.orderId.slice(-8).toUpperCase())
  const rows = opts.items.map(i => `
    <tr>
      <td>${i.title} × ${i.quantity}</td>
      <td>${inr(i.unitPriceInPaise * i.quantity)}</td>
    </tr>`).join("")

  const html = base(`Order ${ref} confirmed — Irraya`, `
    <h1>Order confirmed!</h1>
    <p>Hi ${opts.name || opts.email},</p>
    <p>Thank you for your order. We've received it and will start processing shortly.</p>
    <p><span class="badge">Order ${ref}</span></p>
    <hr class="divider"/>
    <table class="table">
      ${rows}
      <tr style="font-size:15px;font-weight:700;">
        <td>Total</td>
        <td>${inr(opts.totalInPaise)}</td>
      </tr>
    </table>
    <hr class="divider"/>
    <p>We'll send you another email when your order ships. If you have any questions, please contact us at <a href="mailto:info@irraya.com">info@irraya.com</a>.</p>
  `)

  return {
    subject: `Your Irraya order ${ref} is confirmed`,
    html,
    text: `Hi ${opts.name || opts.email}, your Irraya order ${ref} is confirmed. Total: ${inr(opts.totalInPaise)}.`,
  }
}

// ---------------------------------------------------------------------------
// New order — admin alert
// ---------------------------------------------------------------------------
export function orderPlacedAdminTemplate(opts: {
  orderId: string
  orderRef?: string
  displayId?: number
  customerName?: string
  customerEmail?: string
  items: Array<{ title: string; quantity: number; unitPriceInPaise: number }>
  totalInPaise: number
}) {
  const ref = opts.orderRef || (opts.displayId ? `#${opts.displayId}` : opts.orderId.slice(-8).toUpperCase())
  const rows = opts.items.map(i => `
    <tr>
      <td>${i.title} × ${i.quantity}</td>
      <td>${inr(i.unitPriceInPaise * i.quantity)}</td>
    </tr>`).join("")

  const html = base(`New order ${ref} — Irraya Admin`, `
    <h1>New order received</h1>
    <p><span class="badge">Order ${ref}</span></p>
    <p>
      <strong>Customer:</strong> ${opts.customerName || "—"}<br/>
      <strong>Email:</strong> ${opts.customerEmail || "—"}
    </p>
    <hr class="divider"/>
    <table class="table">
      ${rows}
      <tr style="font-size:15px;font-weight:700;">
        <td>Total</td>
        <td>${inr(opts.totalInPaise)}</td>
      </tr>
    </table>
    <hr class="divider"/>
    <p><a class="btn" href="${process.env.MEDUSA_ADMIN_URL || "https://api.irraya.com/app"}/orders/${opts.orderId}">View order in admin</a></p>
  `)

  return {
    subject: `New order ${ref} — ${inr(opts.totalInPaise)}`,
    html,
    text: `New Irraya order ${ref} from ${opts.customerEmail || "unknown"}. Total: ${inr(opts.totalInPaise)}.`,
  }
}

// ---------------------------------------------------------------------------
// Order shipped — customer copy
// ---------------------------------------------------------------------------
export function orderShippedTemplate(opts: {
  name?: string
  email: string
  orderId: string
  displayId?: number
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
}) {
  const ref = opts.displayId ? `#${opts.displayId}` : opts.orderId.slice(-8).toUpperCase()
  const trackingBlock = opts.trackingUrl
    ? `<p><a class="btn" href="${opts.trackingUrl}">Track your order</a></p>`
    : opts.trackingNumber
      ? `<p>Tracking number: <strong>${opts.trackingNumber}</strong>${opts.carrier ? ` via ${opts.carrier}` : ""}</p>`
      : ""

  const html = base(`Order ${ref} shipped — Irraya`, `
    <h1>Your order is on its way!</h1>
    <p>Hi ${opts.name || opts.email},</p>
    <p>Great news — your order <span class="badge">${ref}</span> has been shipped and is heading your way.</p>
    ${trackingBlock}
    <p style="color:#888;font-size:13px;">Estimated delivery is typically 3–7 business days. Questions? <a href="mailto:info@irraya.com">info@irraya.com</a></p>
  `)

  return {
    subject: `Your Irraya order ${ref} has shipped`,
    html,
    text: `Hi ${opts.name || opts.email}, your Irraya order ${ref} has shipped. ${opts.trackingUrl ? `Track it: ${opts.trackingUrl}` : ""}`,
  }
}

// ---------------------------------------------------------------------------
// Order delivered — customer copy
// ---------------------------------------------------------------------------
export function orderDeliveredTemplate(opts: {
  name?: string
  email: string
  orderId: string
  displayId?: number
}) {
  const ref = opts.displayId ? `#${opts.displayId}` : opts.orderId.slice(-8).toUpperCase()

  const html = base(`Order ${ref} delivered — Irraya`, `
    <h1>Your order has been delivered!</h1>
    <p>Hi ${opts.name || opts.email},</p>
    <p>Your Irraya order <span class="badge">${ref}</span> has been delivered. We hope you love it!</p>
    <p>If anything is wrong with your order, you can request a return or exchange within <strong>48 hours</strong> of delivery.</p>
    <p><a class="btn" href="https://irraya.com/orders">View my orders</a></p>
    <hr class="divider"/>
    <p style="color:#888;font-size:13px;">Need help? <a href="mailto:info@irraya.com">info@irraya.com</a></p>
  `)

  return {
    subject: `Your Irraya order ${ref} has been delivered`,
    html,
    text: `Hi ${opts.name || opts.email}, your Irraya order ${ref} has been delivered. You have 48 hours to request a return.`,
  }
}

// ---------------------------------------------------------------------------
// Order cancelled — customer copy
// ---------------------------------------------------------------------------
export function orderCancelledTemplate(opts: {
  name?: string
  email: string
  orderId: string
  orderRef?: string
  displayId?: number
  totalInPaise: number
  refundInitiated?: boolean
  requestedByUser?: boolean
}) {
  const ref = opts.orderRef || (opts.displayId ? `#${opts.displayId}` : opts.orderId.slice(-8).toUpperCase())
  const refundNote = opts.refundInitiated
    ? `<p>A refund of <strong>${inr(opts.totalInPaise)}</strong> has been initiated and will reflect in your account within 5–7 business days.</p>`
    : ""

  const body = opts.requestedByUser
    ? `<p>Your cancellation request for order <span class="badge">${ref}</span> has been approved and the order has been cancelled.</p>
       ${refundNote}
       <p>If you have any questions, contact us at <a href="mailto:info@irraya.com">info@irraya.com</a>.</p>`
    : `<p>Your order <span class="badge">${ref}</span> has been cancelled.</p>
       ${refundNote}
       <p>If you did not expect this or have questions, please contact us at <a href="mailto:info@irraya.com">info@irraya.com</a> and we'll help you out.</p>`

  const html = base(`Order ${ref} cancelled — Irraya`, `
    <h1>Order cancelled</h1>
    <p>Hi ${opts.name || opts.email},</p>
    ${body}
  `)

  return {
    subject: `Your Irraya order ${ref} has been cancelled`,
    html,
    text: `Hi ${opts.name || opts.email}, your Irraya order ${ref} has been cancelled.${opts.refundInitiated ? ` Refund of ${inr(opts.totalInPaise)} initiated.` : ""}`,
  }
}

// ---------------------------------------------------------------------------
// Order Request — admin copy
// ---------------------------------------------------------------------------
export function orderRequestAdminTemplate(opts: {
  orderId: string
  orderRef?: string
  displayId?: number
  requestType: string
  reason: string
  notes?: string
  customerEmail: string
  customerName?: string
}) {
  const ref = opts.orderRef || (opts.displayId ? `#${opts.displayId}` : opts.orderId.slice(-8).toUpperCase())
  const typeDisplay = opts.requestType.charAt(0).toUpperCase() + opts.requestType.slice(1)
  
  const html = base(`New ${typeDisplay} Request for ${ref}`, `
    <h1>New ${typeDisplay} Request</h1>
    <p>A customer has submitted a new <strong>${opts.requestType}</strong> request for order <span class="badge">${ref}</span>.</p>
    
    <table class="items-table">
      <tr><td style="color:#666;width:100px;">Customer</td><td>${opts.customerName || "Unknown"} (<a href="mailto:${opts.customerEmail}">${opts.customerEmail}</a>)</td></tr>
      <tr><td style="color:#666;">Reason</td><td>${opts.reason}</td></tr>
      ${opts.notes ? `<tr><td style="color:#666;">Notes</td><td>${opts.notes}</td></tr>` : ""}
    </table>
    
    <p style="margin-top:20px;"><a class="btn" href="https://api.irraya.com/app/orders/${opts.orderId}">View Order in Admin</a></p>
  `)

  return {
    subject: `[Request] ${typeDisplay} request for ${ref}`,
    html,
    text: `New ${opts.requestType} request for ${ref} by ${opts.customerEmail}. Reason: ${opts.reason}`,
  }
}
