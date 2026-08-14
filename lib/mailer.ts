import nodemailer from 'nodemailer'

/**
 * Real email delivery via Gmail SMTP through Nodemailer (RULES.md's
 * established choice), using this repo's existing NODEMAILER_USER/
 * NODEMAILER_PASS env vars. Lazily constructed so a missing/incomplete
 * .env doesn't crash the app at import time — only the first actual
 * send attempt fails, with a clear error the caller can log/surface.
 */
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (transporter) return transporter
  const user = process.env.NODEMAILER_USER
  const pass = process.env.NODEMAILER_PASS
  if (!user || !pass) {
    throw new Error('Email is not configured: NODEMAILER_USER/NODEMAILER_PASS are not set in .env')
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
  return transporter
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.NODEMAILER_USER
  await getTransporter().sendMail({ from, to, subject, html })
}

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
}
