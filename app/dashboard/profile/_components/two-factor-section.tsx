'use client'

import { useState } from 'react'
import { ShieldCheck, KeyRound, QrCode } from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import { ElegantButton } from '@/components/ui/elegant-button'
import { mockRecoveryCodes } from './security-mock-data'

/** Roles that can enable 2FA, per APP_DOC Task 1.5 (admin/manager/librarian — mapped to "staff" here). */
const TWO_FACTOR_ELIGIBLE_ROLES: UserRole[] = ['admin', 'manager', 'staff']

/**
 * 2FA setup: toggle + mocked QR placeholder + static recovery codes.
 * Visibility is gated to admin/manager/staff — per the product spec, 2FA
 * does not apply to contributor/member roles.
 */
export function TwoFactorSection() {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)

  if (!user || !TWO_FACTOR_ELIGIBLE_ROLES.includes(user.role)) return null

  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel text-lg font-semibold text-w-950 flex items-center gap-2">
          <ShieldCheck size={18} className="text-w-600" /> Two-Factor Authentication
        </h3>
        <button
          onClick={() => setEnabled((v) => !v)}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle two-factor authentication"
          className={`w-11 h-6 rounded-full relative transition-colors ${enabled ? 'bg-w-600' : 'bg-w-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'left-5.5' : 'left-0.5'}`} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-32 h-32 bg-w-100 border border-w-300 rounded-lg flex items-center justify-center shrink-0">
              <QrCode size={64} className="text-w-500" />
            </div>
            <p className="font-lato text-sm text-w-700 leading-relaxed">
              Scan this QR code with your authenticator app, then enter the 6-digit code it generates to confirm setup.
            </p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
              <KeyRound size={12} /> Recovery Codes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mockRecoveryCodes.map((code) => (
                <span key={code} className="font-mono text-xs text-w-700 bg-w-100 px-2 py-1 rounded text-center">{code}</span>
              ))}
            </div>
            <p className="font-lato text-xs text-w-500 mt-2">Store these somewhere safe — each code can only be used once.</p>
          </div>

          <ElegantButton variant="primary" className="text-sm py-2">Confirm Setup</ElegantButton>
        </div>
      )}
    </div>
  )
}
