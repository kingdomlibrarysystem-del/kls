'use client'

interface LiveCaptionOverlayProps {
  active: boolean
  caption: string
  unsupported: boolean
}

/** Meet-style live caption bar overlaid at the bottom of the video grid — shows the LOCAL user's own in-progress speech only (see use-live-transcript.ts's docstring for why). */
export function LiveCaptionOverlay({ active, caption, unsupported }: LiveCaptionOverlayProps) {
  if (!active) return null

  return (
    <div
      style={{
        position: 'absolute', left: 12, right: 12, bottom: 108, zIndex: 5,
        background: 'rgba(0,0,0,0.75)', color: '#fff', borderRadius: 8,
        padding: '8px 14px', fontSize: 12, textAlign: 'center', pointerEvents: 'none',
      }}
    >
      {unsupported
        ? 'Live captions aren\'t supported in this browser — try Chrome or Edge.'
        : caption || 'Listening…'}
    </div>
  )
}
