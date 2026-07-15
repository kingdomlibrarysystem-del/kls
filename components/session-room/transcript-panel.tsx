'use client'

import { useState } from 'react'
import { FileText, Copy, Check } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { TranscriptEntry } from './use-live-transcript'

interface TranscriptPanelProps {
  entries: TranscriptEntry[]
  unsupported: boolean
}

/** Simple session transcript log — only ever contains the LOCAL user's own transcribed speech (see use-live-transcript.ts), never other participants'. Copyable as plain text, same idea as InviteLinkModal's copy-link action. */
export function TranscriptPanel({ entries, unsupported }: TranscriptPanelProps) {
  const [copied, setCopied] = useState(false)

  const asText = entries.map((e) => `[${new Date(e.at).toLocaleTimeString()}] ${e.speaker}: ${e.text}`).join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(asText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} color="var(--gold)" /> Transcript (you only)</span>
        {entries.length > 0 && (
          <button
            onClick={handleCopy}
            aria-label="Copy transcript"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: 'none', background: copied ? 'var(--green)' : 'var(--gold)', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <div style={{ padding: 8, maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {unsupported ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 4px' }}>
            Live transcription isn&apos;t supported in this browser — try Chrome or Edge.
          </p>
        ) : entries.length === 0 ? (
          <EmptyState icon={FileText} title="No captions yet" description="Turn on Captions to start transcribing your own speech." style={{ padding: '16px 8px', color: 'var(--text-secondary)' }} />
        ) : (
          entries.map((e) => (
            <div key={e.id} style={{ fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>{new Date(e.at).toLocaleTimeString()} </span>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{e.speaker}: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{e.text}</span>
            </div>
          ))
        )}
      </div>
      <p style={{ fontSize: 9, color: 'var(--text-muted)', padding: '6px 12px', borderTop: '1px solid var(--border)' }}>
        Only your own speech is transcribed — there's no real audio stream from other participants to capture.
      </p>
    </div>
  )
}
