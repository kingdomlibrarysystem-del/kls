'use client'

import { ShieldCheck } from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/auth-context'

/** Roles that can enable 2FA, per APP_DOC Task 1.5 (admin/manager/librarian — mapped to "staff" here). */
const TWO_FACTOR_ELIGIBLE_ROLES: UserRole[] = ['admin', 'manager', 'staff']

/**
 * Honest "not yet available" state — real TOTP-based 2FA (secret
 * generation, QR code, verify-code confirmation, recovery codes) needs a
 * dedicated authenticator library and a verify flow, not just a database
 * row, so it isn't faked here with a toggle that doesn't actually enable
 * anything. Visibility stays gated to admin/manager/staff per the product
 * spec — contributors and members don't see this section either way.
 */
export function TwoFactorSection() {
  const { user } = useAuth()

  if (!user || !TWO_FACTOR_ELIGIBLE_ROLES.includes(user.role)) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <ShieldCheck size={14} color="var(--gold)" /> Two-Factor Authentication
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        Two-factor authentication is planned for a future release and is not yet available.
      </p>
    </div>
  )
}
