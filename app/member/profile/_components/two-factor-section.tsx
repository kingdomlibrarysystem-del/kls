'use client'

import { useState } from 'react'
import { ShieldCheck, KeyRound, QrCode, ShieldOff } from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import { useTwoFactor } from '@/app/member/_shared/use-two-factor'

/** Roles that can enable 2FA, per APP_DOC Task 1.5 (admin/manager/librarian — mapped to "staff" here). */
const TWO_FACTOR_ELIGIBLE_ROLES: UserRole[] = ['admin', 'manager', 'staff']

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }
const buttonStyle: React.CSSProperties = { padding: '8px 14px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }

/**
 * Real TOTP-based 2FA — same flow as the dashboard's TwoFactorSection,
 * rendered in this module's inline-style dialect. See that file's
 * comment for the full setup/verify/disable design.
 */
export function TwoFactorSection() {
  const { user } = useAuth()
  const { enabled, loading, refetch } = useTwoFactor(user?.id)
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'recovery'>('idle')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user || !TWO_FACTOR_ELIGIBLE_ROLES.includes(user.role) || loading) return null

  const startSetup = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      if (json.code !== 'success') throw new Error(json.message)
      setQrDataUrl(json.data.qrDataUrl)
      setSecret(json.data.secret)
      setStep('setup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start 2FA setup')
    } finally {
      setBusy(false)
    }
  }

  const confirmSetup = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, code }),
      })
      const json = await res.json()
      if (json.code !== 'success') throw new Error(json.message)
      setRecoveryCodes(json.data.recoveryCodes)
      setStep('recovery')
      setCode('')
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code is incorrect')
    } finally {
      setBusy(false)
    }
  }

  const disable2fa = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: password }),
      })
      const json = await res.json()
      if (json.code !== 'success') throw new Error(json.message)
      setPassword('')
      setStep('idle')
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable two-factor authentication')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={14} color="var(--gold)" /> Two-Factor Authentication
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: enabled ? 'var(--green-dim)' : 'var(--bg-section)', color: enabled ? 'var(--green-light)' : 'var(--text-muted)' }}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '6px 10px', fontSize: 10, marginBottom: 10 }}>{error}</div>
      )}

      {enabled && step === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Disabling requires your current password.</p>
          <input type="password" placeholder="Current password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={disable2fa} disabled={busy || !password.trim()} style={{ ...buttonStyle, background: 'var(--red)', opacity: busy || !password.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <ShieldOff size={12} /> Disable Two-Factor Authentication
          </button>
        </div>
      )}

      {!enabled && step === 'idle' && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>Add an extra layer of security using an authenticator app.</p>
          <button onClick={startSetup} disabled={busy} style={buttonStyle}>Enable Two-Factor Authentication</button>
        </div>
      )}

      {step === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="flex flex-col sm:flex-row" style={{ gap: 12 }}>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data: URI QR code, not a remote/optimizable image
              <img src={qrDataUrl} alt="Two-factor authentication QR code" width={100} height={100} style={{ borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <QrCode size={48} color="var(--text-muted)" />
              </div>
            )}
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Scan this QR code with your authenticator app, then enter the 6-digit code it generates to confirm setup.
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--text-muted)', marginTop: 6, wordBreak: 'break-all' }}>Manual entry key: {secret}</p>
            </div>
          </div>
          <input type="text" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />
          <button onClick={confirmSetup} disabled={busy || code.trim().length < 6} style={{ ...buttonStyle, opacity: busy || code.trim().length < 6 ? 0.6 : 1, alignSelf: 'flex-start' }}>
            Confirm Setup
          </button>
        </div>
      )}

      {step === 'recovery' && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--green-light)', marginBottom: 10 }}>Two-factor authentication is now enabled.</p>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <KeyRound size={11} /> RECOVERY CODES
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 6 }}>
            {recoveryCodes.map((rc) => (
              <span key={rc} style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-section)', padding: '4px 6px', borderRadius: 4, textAlign: 'center' }}>{rc}</span>
            ))}
          </div>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 8 }}>Store these somewhere safe — each code can only be used once, and this is the only time they&apos;ll be shown.</p>
          <button onClick={() => setStep('idle')} style={{ ...buttonStyle, background: 'var(--bg-section)', color: 'var(--text-primary)', marginTop: 10 }}>Done</button>
        </div>
      )}
    </div>
  )
}
