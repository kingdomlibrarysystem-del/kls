'use client'

import { useState } from 'react'
import { ShieldCheck, KeyRound, QrCode, ShieldOff } from 'lucide-react'
import { useAuth, type UserRole } from '@/contexts/auth-context'
import { ElegantButton } from '@/components/ui/elegant-button'
import { FormInput } from '@/components/ui/form-input'
import { useTwoFactor } from './use-two-factor'

/** Roles that can enable 2FA, per APP_DOC Task 1.5 (admin/manager/librarian — mapped to "staff" here). */
const TWO_FACTOR_ELIGIBLE_ROLES: UserRole[] = ['admin', 'manager', 'staff']

/**
 * Real TOTP-based 2FA: setup generates a secret + QR via
 * /api/auth/2fa/setup, verify confirms a real generated code via
 * /api/auth/2fa/verify (only then does the server flip `enabled` and
 * issue recovery codes), disable requires the current password via
 * /api/auth/2fa/disable. Replaces the previous "not yet available"
 * placeholder now that the TOTP library + verify flow exist.
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
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel text-lg font-semibold text-w-950 flex items-center gap-2">
          <ShieldCheck size={18} className="text-w-600" /> Two-Factor Authentication
        </h3>
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${enabled ? 'bg-green-50 text-green-800 border-green-200' : 'bg-w-100 text-w-700 border-w-300'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs mb-4">{error}</div>
      )}

      {enabled && step === 'idle' && (
        <div className="space-y-3">
          <p className="font-lato text-sm text-w-700">Two-factor authentication is protecting this account. Disabling it requires your current password.</p>
          <FormInput type="password" placeholder="Current password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <ElegantButton variant="outline" className="text-sm py-2" onClick={disable2fa} loading={busy} disabled={!password.trim()}>
            <ShieldOff size={14} /> Disable Two-Factor Authentication
          </ElegantButton>
        </div>
      )}

      {!enabled && step === 'idle' && (
        <div>
          <p className="font-lato text-sm text-w-700 mb-4">Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.).</p>
          <ElegantButton variant="primary" className="text-sm py-2" onClick={startSetup} loading={busy}>
            Enable Two-Factor Authentication
          </ElegantButton>
        </div>
      )}

      {step === 'setup' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data: URI QR code, not a remote/optimizable image
              <img src={qrDataUrl} alt="Two-factor authentication QR code" width={128} height={128} className="border border-w-300 rounded-lg shrink-0" />
            ) : (
              <div className="w-32 h-32 bg-w-100 border border-w-300 rounded-lg flex items-center justify-center shrink-0">
                <QrCode size={64} className="text-w-500" />
              </div>
            )}
            <div>
              <p className="font-lato text-sm text-w-700 leading-relaxed">
                Scan this QR code with your authenticator app, then enter the 6-digit code it generates to confirm setup.
              </p>
              <p className="font-mono text-xs text-w-500 mt-2 break-all">Manual entry key: {secret}</p>
            </div>
          </div>

          <FormInput type="text" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />

          <ElegantButton variant="primary" className="text-sm py-2" onClick={confirmSetup} loading={busy} disabled={code.trim().length < 6}>
            Confirm Setup
          </ElegantButton>
        </div>
      )}

      {step === 'recovery' && (
        <div>
          <p className="font-lato text-sm text-green-700 mb-3">Two-factor authentication is now enabled.</p>
          <div>
            <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
              <KeyRound size={12} /> Recovery Codes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {recoveryCodes.map((rc) => (
                <span key={rc} className="font-mono text-xs text-w-700 bg-w-100 px-2 py-1 rounded text-center">{rc}</span>
              ))}
            </div>
            <p className="font-lato text-xs text-w-500 mt-2">Store these somewhere safe — each code can only be used once, and this is the only time they&apos;ll be shown.</p>
          </div>
          <ElegantButton variant="secondary" className="text-sm py-2 mt-4" onClick={() => setStep('idle')}>
            Done
          </ElegantButton>
        </div>
      )}
    </div>
  )
}
