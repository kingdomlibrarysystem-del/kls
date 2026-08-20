import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { RoomErrorBanner, PERMISSION_ERROR_COPY } from './room-error-banner'
import type { MediaPermissionError } from './use-media-stream'
import type { RecordingError } from './use-session-recording'

interface RoomHeaderProps {
  viewer: 'learner' | 'admin'
  onBack: () => void
  mediaError: MediaPermissionError
  recordingError: RecordingError
  /** True once this room is a real LiveKit connection — swaps the honest "still a mock" disclaimer for a real "connected" banner. */
  liveKitActive: boolean
  /** Set when LiveKit IS configured but the connection itself failed (bad token, network, wrong URL) — distinct from "not configured at all," so a real misconfiguration is visible instead of silently looking identical to the intentional mock fallback. */
  liveKitConnectError?: string | null
}

/** Back link, room-status disclaimer, and permission-error banners — split out of session-room-view.tsx to keep that file under the 200-line cap. */
export function RoomHeader({ viewer, onBack, mediaError, recordingError, liveKitActive, liveKitConnectError }: RoomHeaderProps) {
  return (
    <>
      <button
        onClick={onBack}
        aria-label={viewer === 'admin' ? 'Back to session oversight' : 'Back to my sessions'}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', width: 'fit-content' }}
      >
        <ChevronLeft size={14} /> {viewer === 'admin' ? 'Back to Session Oversight' : 'Back to My Sessions'}
      </button>

      {liveKitActive ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-dim, rgba(34,197,94,0.1))', border: '1px solid var(--green, #22c55e)', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green, #22c55e)', flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Connected — camera, mic, screen share, and chat are real-time and visible to every other participant in this room.
          </p>
        </div>
      ) : liveKitConnectError ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-dim, rgba(239,68,68,0.1))', border: '1px solid var(--red, #ef4444)', borderRadius: 8, padding: '8px 12px' }}>
          <AlertTriangle size={14} color="var(--red, #ef4444)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Couldn&apos;t connect to the real-time room ({liveKitConnectError}) — falling back to the local-only mock. Check LIVEKIT_URL/LIVEKIT_API_KEY/LIVEKIT_API_SECRET and that the server process was restarted after they were set.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
          <AlertTriangle size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Mock Session Room — your own camera, mic, screen share, recording, and captions are all real browser
            features. Other participants are placeholders only: real-time video isn&apos;t configured for this
            environment yet.
          </p>
        </div>
      )}

      {mediaError && <RoomErrorBanner message={PERMISSION_ERROR_COPY[mediaError]} />}
      {recordingError && (
        <RoomErrorBanner message={recordingError === 'unsupported' ? 'Recording isn\'t supported in this browser.' : 'Couldn\'t start recording — turn on your camera or start presenting first.'} />
      )}
    </>
  )
}
