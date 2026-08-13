'use client'

import { Monitor } from 'lucide-react'

/**
 * Honest "not yet available" state — auth uses NextAuth's JWT session
 * strategy, so no per-device session row exists in the database to list
 * or revoke. Real multi-device session tracking would require switching
 * to database-backed sessions (a separate auth-architecture decision),
 * so this isn't faked with a static device list that a "Revoke" button
 * can't actually act on.
 */
export function SessionsSection() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Monitor size={14} color="var(--gold)" /> Sessions & Devices
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        Session and device management is planned for a future release and is not yet available.
      </p>
    </div>
  )
}
