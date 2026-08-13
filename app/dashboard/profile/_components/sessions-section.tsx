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
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <h3 className="font-cinzel text-lg font-semibold text-w-950 flex items-center gap-2 mb-2">
        <Monitor size={18} className="text-w-600" /> Sessions & Devices
      </h3>
      <p className="font-lato text-sm text-w-600">
        Session and device management is planned for a future release and is not yet available.
      </p>
    </div>
  )
}
