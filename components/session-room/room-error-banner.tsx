'use client'

import { AlertCircle } from 'lucide-react'
import type { MediaPermissionError } from './use-media-stream'

/** Copy for each getUserMedia/getDisplayMedia permission failure — kept alongside the banner itself rather than in session-room-view.tsx, to save space there now that it supports a third `viewer` mode. */
export const PERMISSION_ERROR_COPY: Record<NonNullable<MediaPermissionError>, string> = {
  camera: 'Camera access was blocked or denied — check your browser\'s site permissions and try again.',
  mic: 'Microphone access was blocked or denied — check your browser\'s site permissions and try again.',
  'screen-share': 'Screen share couldn\'t start — check your browser\'s permissions and try again.',
}

/** "MM:SS" formatter for the recording timer. */
export function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/** Shared inline error banner for permission/media failures — this app's existing Dialect B error convention (var(--red-dim)/var(--red-light)), reused for camera/mic/screen-share/recording errors alike rather than one-off inline blocks per error type. */
export function RoomErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <AlertCircle size={14} style={{ flexShrink: 0 }} /> {message}
    </div>
  )
}
