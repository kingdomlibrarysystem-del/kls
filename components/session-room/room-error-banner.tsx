'use client'

import { AlertCircle } from 'lucide-react'

/** Shared inline error banner for permission/media failures — this app's existing Dialect B error convention (var(--red-dim)/var(--red-light)), reused for camera/mic/screen-share/recording errors alike rather than one-off inline blocks per error type. */
export function RoomErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <AlertCircle size={14} style={{ flexShrink: 0 }} /> {message}
    </div>
  )
}
