'use client'

import { useEffect, useState } from 'react'
import { SectionHeader } from '@/components/ui/section-header'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'

interface AccountInfo {
  status: string
  emailVerified: boolean
  createdAt: string
}

/** Real "Account Information" block — fetches the signed-in user's own record from /api/users/[id] for fields (createdAt/status/emailVerified) the session JWT doesn't carry live. */
export function AccountInfoSection() {
  const { user } = useAuth()
  const [info, setInfo] = useState<AccountInfo | null>(null)

  useEffect(() => {
    if (!user) return
    fetch(`/api/users/${user.id}`)
      .then((res) => res.json())
      .then((json) => setInfo(json.data))
  }, [user])

  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <SectionHeader>Account Information</SectionHeader>
      <div className="space-y-4 font-lato text-sm text-w-700">
        <div className="flex justify-between">
          <span>Account Created:</span>
          <span className="font-semibold text-w-950">{info ? info.createdAt : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>Account Status:</span>
          <span className={`font-semibold ${info?.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
            {info ? info.status.charAt(0).toUpperCase() + info.status.slice(1) : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Email Verified:</span>
          <span className={`font-semibold ${info?.emailVerified ? 'text-green-700' : 'text-red-700'}`}>
            {info ? (info.emailVerified ? 'Yes' : 'No') : '—'}
          </span>
        </div>
        <div className="border-t border-w-400 pt-4 mt-4">
          <p className="text-xs text-w-600 mb-3">
            For security concerns or to permanently delete your account,
            please contact our support team.
          </p>
          <ElegantButton variant="outline">Contact Support</ElegantButton>
        </div>
      </div>
    </div>
  )
}
