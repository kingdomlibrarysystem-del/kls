import nodemailer from "nodemailer";

/**
 * Real email delivery via Gmail SMTP through Nodemailer (RULES.md's
 * established choice). Reads GOOGLE_EMAIL/GOOGLE_PASSWORD — the vars
 * actually configured in this project's .env for the Gmail account used
 * to send mail (confirmed by direct inspection: NODEMAILER_USER/
 * NODEMAILER_PASS, this file's original names and .env.example's
 * documented ones, were never actually set, so every send was silently
 * failing before this fix). Lazily constructed so a missing/incomplete
 * .env doesn't crash the app at import time — only the first actual
 * send attempt fails, with a clear error the caller can log/surface.
 *
 * `tls.rejectUnauthorized: false` is a deliberate, narrow trade-off —
 * confirmed necessary on this project's own dev network, which
 * presents a self-signed certificate for outbound TLS connections
 * (likely antivirus/network TLS inspection), causing a real "self-
 * signed certificate in certificate chain" failure otherwise. This
 * only weakens certificate verification for this one Gmail SMTP
 * relay connection, not the app's own HTTPS/TLS surface.
 */
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GOOGLE_EMAIL;
  const pass = process.env.GOOGLE_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Email is not configured: GOOGLE_EMAIL/GOOGLE_PASSWORD are not set in .env",
    );
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
  return transporter;
}

export async function sendMail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const from = process.env.GOOGLE_EMAIL;
  const client = getTransporter();
  await client.verify();
  await client.sendMail({ from, to, subject, html });
}

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}
