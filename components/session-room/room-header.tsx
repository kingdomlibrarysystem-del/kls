import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { RoomErrorBanner, PERMISSION_ERROR_COPY } from './room-error-banner'
import type { MediaPermissionError } from './use-media-stream'
import type { RecordingError } from './use-session-recording'

interface RoomHeaderProps {
  viewer: 'learner' | 'admin'
  onBack: () => void
  mediaError: MediaPermissionError
  recordingError: RecordingError
}

/** Back link, mock-room disclaimer, and permission-error banners — split out of session-room-view.tsx to keep that file under the 200-line cap. */
export function RoomHeader({ viewer, onBack, mediaError, recordingError }: RoomHeaderProps) {
  return (
    <>
      <button
        onClick={onBack}
        aria-label={viewer === 'admin' ? 'Back to session oversight' : 'Back to my sessions'}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', width: 'fit-content' }}
      >
        <ChevronLeft size={14} /> {viewer === 'admin' ? 'Back to Session Oversight' : 'Back to My Sessions'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <AlertTriangle size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Mock Session Room — your own camera, mic, screen share, recording, and captions are all real browser
          features. Other participants are placeholders only: no signaling backend exists to carry a real peer's
          video, audio, or speech here.
        </p>
      </div>

      {mediaError && <RoomErrorBanner message={PERMISSION_ERROR_COPY[mediaError]} />}
      {recordingError && (
        <RoomErrorBanner message={recordingError === 'unsupported' ? 'Recording isn\'t supported in this browser.' : 'Couldn\'t start recording — turn on your camera or start presenting first.'} />
      )}
    </>
  )
}
