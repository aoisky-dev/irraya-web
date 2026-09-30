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

function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.smtp2go.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    })
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

  await getTransporter().sendMail({ from, ...opts })
}

export const ADMIN_EMAIL = (): string =>
  process.env.ADMIN_NOTIFICATION_EMAIL || "info@irraya.com"
