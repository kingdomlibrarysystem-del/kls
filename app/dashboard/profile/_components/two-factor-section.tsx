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
 * spec — contributor/member roles don't see this section either way.
 */
export function TwoFactorSection() {
  const { user } = useAuth()

  if (!user || !TWO_FACTOR_ELIGIBLE_ROLES.includes(user.role)) return null

  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <h3 className="font-cinzel text-lg font-semibold text-w-950 flex items-center gap-2 mb-2">
        <ShieldCheck size={18} className="text-w-600" /> Two-Factor Authentication
      </h3>
      <p className="font-lato text-sm text-w-600">
        Two-factor authentication is planned for a future release and is not yet available.
      </p>
    </div>
  )
}
