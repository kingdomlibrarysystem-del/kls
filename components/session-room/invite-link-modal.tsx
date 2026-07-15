'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, LogIn } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'

interface InviteLinkModalProps {
  open: boolean
  onClose: () => void
  /** The real, existing room route for this session — e.g. /lecturer/sessions/{id}/room. Copying it is honest because it's the actual route the room lives at, unlike a real multi-tenant invite/token system this mock has no backend for. */
  roomHref: string
}

/** Meet-style "Your meeting's ready" confirmation — shown right after an instant session is created, before navigating in, so the room link can be copied/shared first. */
export function InviteLinkModal({ open, onClose, roomHref }: InviteLinkModalProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${roomHref}` : roomHref

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Your Session Is Ready" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Share this link with anyone you want in the session — it's the real room URL, so anyone signed into the
          Kingdom Library who opens it lands in this exact session.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: 'var(--bg-section)' }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullUrl}</span>
          <button
            onClick={handleCopy}
            aria-label="Copy room link"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: 'none', background: copied ? 'var(--green)' : 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <ElegantButton type="button" variant="outline" onClick={onClose}>Close</ElegantButton>
          <ElegantButton type="button" variant="primary" onClick={() => router.push(roomHref)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={14} /> Enter Session</span>
          </ElegantButton>
        </div>
      </div>
    </Modal>
  )
}
