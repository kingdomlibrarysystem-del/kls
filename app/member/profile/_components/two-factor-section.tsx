'use client'

import { useState } from 'react'
import { ShieldCheck, KeyRound, QrCode } from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import { mockRecoveryCodes } from './security-mock-data'

/** Roles that can enable 2FA, per APP_DOC Task 1.5 (admin/manager/librarian — mapped to "staff" here). */
const TWO_FACTOR_ELIGIBLE_ROLES: UserRole[] = ['admin', 'manager', 'staff']

/**
 * 2FA setup: toggle + mocked QR placeholder + static recovery codes.
 * Visibility is gated to admin/manager/staff — contributors and members do
 * not see this section, per the product spec.
 */
export function TwoFactorSection() {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)

  if (!user || !TWO_FACTOR_ELIGIBLE_ROLES.includes(user.role)) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={14} color="var(--gold)" /> Two-Factor Authentication
        </span>
        <button
          onClick={() => setEnabled((v) => !v)}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle two-factor authentication"
          style={{
            width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: enabled ? 'var(--gold)' : 'var(--bg-section)', position: 'relative', transition: 'background 0.15s',
          }}
        >
          <span style={{ position: 'absolute', top: 2, left: enabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
        </button>
      </div>

      {enabled && (
        <div style={{ padding: '14px' }}>
          <div className="flex flex-col sm:flex-row" style={{ gap: 12, marginBottom: 14 }}>
            <div style={{ width: 100, height: 100, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <QrCode size={48} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Scan this QR code with your authenticator app, then enter the 6-digit code it generates to confirm setup.
            </p>
          </div>

          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <KeyRound size={11} /> RECOVERY CODES
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 6 }}>
            {mockRecoveryCodes.map((code) => (
              <span key={code} style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-section)', padding: '4px 6px', borderRadius: 4, textAlign: 'center' }}>{code}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
