/** Minimal, inline-styled HTML templates — no external email framework needed for two transactional emails. */

export function verificationEmailHtml(firstName: string, verifyUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2c2416;">
      <h2 style="color: #8a6d3b;">Kingdom Library System</h2>
      <p>Hi ${firstName},</p>
      <p>Thanks for creating an account. Please verify your email address to activate it:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #b8860b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
      </p>
      <p style="font-size: 12px; color: #8a6d3b;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
  `
}

export function passwordResetEmailHtml(firstName: string, resetUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2c2416;">
      <h2 style="color: #8a6d3b;">Kingdom Library System</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click below to choose a new one:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #b8860b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </p>
      <p style="font-size: 12px; color: #8a6d3b;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will not change.</p>
    </div>
  `
}
