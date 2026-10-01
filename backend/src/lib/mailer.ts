import nodemailer, { type Transporter } from "nodemailer"

// ---------------------------------------------------------------------------
// Provider-agnostic SMTP mailer.
//
// To switch from SMTP2GO to Brevo (or any other provider), only env vars
// need to change — zero code changes required:
//
//   SMTP2GO:  SMTP_HOST=mail.smtp2go.com  SMTP_USER=<smtp2go-user>  SMTP_PASS=<smtp2go-pass>
//   Brevo:    SMTP_HOST=smtp-relay.brevo.com  SMTP_USER=<brevo-email>  SMTP_PASS=<brevo-smtp-key>
// ---------------------------------------------------------------------------

let _transporter: Transporter | null = null

function createTransporter(): Transporter {
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.smtp2go.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    pool: true,
    maxConnections: 3,
  })
  // Verify connection on creation so failures are caught early
  t.verify().catch((err) => {
    console.warn("[mailer] SMTP connection verify failed (will retry on next send):", err.message)
    _transporter = null // reset so the next send creates a fresh transporter
  })
  return t
}

function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = createTransporter()
  }
  return _transporter
}

export type MailOptions = {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendMail(opts: MailOptions): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[mailer] SMTP not configured — skipping email to ${opts.to}: ${opts.subject}`)
    return
  }

  const from = process.env.SMTP_FROM_NAME
    ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`
    : process.env.SMTP_FROM || "noreply@irraya.com"

  try {
    await getTransporter().sendMail({ from, ...opts })
    console.log(`[mailer] Successfully sent email to ${opts.to}: ${opts.subject}`)
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${opts.to}: ${opts.subject}`, err)
    // Reset transporter so the next send attempt gets a fresh connection
    _transporter = null
    throw err
  }
}

export const ADMIN_EMAIL = (): string =>
  process.env.ADMIN_NOTIFICATION_EMAIL || "info@irraya.com"
