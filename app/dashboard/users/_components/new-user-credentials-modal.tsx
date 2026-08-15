'use client'

import { useState } from 'react'
import { AlertTriangle, Copy, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'

interface NewUserCredentials {
  name: string
  email: string
  temporaryPassword: string
}

interface NewUserCredentialsModalProps {
  credentials: NewUserCredentials | null
  onClose: () => void
}

/**
 * One-time password reveal after creating a user — the plaintext
 * temporary password only ever exists in the create-user API response;
 * it is never stored or retrievable afterward, so this is the only
 * chance to see or copy it. Closing this modal without copying it means
 * the password must be reset to be recovered.
 */
export function NewUserCredentialsModal({ credentials, onClose }: NewUserCredentialsModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!credentials) return
    await navigator.clipboard.writeText(credentials.temporaryPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={!!credentials} onClose={onClose} title="User Created" size="sm">
      {credentials && (
        <div>
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <AlertTriangle size={14} className="text-yellow-700 shrink-0" />
            <p className="font-lato text-xs text-yellow-800">
              This password is shown only once. Copy it now and share it securely with {credentials.name} — it cannot be recovered later, only reset.
            </p>
          </div>

          <p className="font-lato text-xs text-w-600 mb-1">Email</p>
          <p className="font-lato text-sm text-w-950 mb-3">{credentials.email}</p>

          <p className="font-lato text-xs text-w-600 mb-1">Temporary Password</p>
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 bg-w-100 border border-w-300 rounded px-3 py-2 text-sm font-mono text-w-950 break-all">
              {credentials.temporaryPassword}
            </code>
            <button
              onClick={handleCopy}
              aria-label="Copy password"
              className="shrink-0 p-2 bg-w-100 border border-w-300 rounded hover:bg-w-200 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-700" /> : <Copy size={16} className="text-w-700" />}
            </button>
          </div>

          <ElegantButton variant="primary" onClick={onClose} className="w-full text-sm py-2">
            Done
          </ElegantButton>
        </div>
      )}
    </Modal>
  )
}
