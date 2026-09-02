'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useCounselingConsent, updateCounselingConsent } from '../../_shared/use-counseling'

/** Real PATCH-backed toggle form for the member's own CounselingConsent row. */
export function ConsentForm() {
  const { user } = useAuth()
  const { data: consent, loading } = useCounselingConsent(user?.id)
  const [shareNotes, setShareNotes] = useState(true)
  const [allowContact, setAllowContact] = useState(true)
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (consent) {
      setShareNotes(consent.shareNotesWithMember)
      setAllowContact(consent.allowStaffContact)
      setEmergencyName(consent.emergencyContactName ?? '')
      setEmergencyPhone(consent.emergencyContactPhone ?? '')
    }
  }, [consent])

  if (loading) {
    return <Skeleton className="h-80 w-full rounded-lg" aria-label="Loading consent settings" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (!user) throw new Error('You must be signed in to update consent settings')
      await updateCounselingConsent(user.id, {
        shareNotesWithMember: shareNotes,
        allowStaffContact: allowContact,
        emergencyContactName: emergencyName.trim() || undefined,
        emergencyContactPhone: emergencyPhone.trim() || undefined,
      })
      setToast('Consent settings saved.')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save consent settings')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl bg-form-highlight border border-w-300 rounded-lg p-5 space-y-4">
      <h3 className="font-cinzel text-sm font-semibold text-w-950 flex items-center gap-2"><ShieldCheck size={16} /> Privacy & Consent</h3>

      {toast && <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded font-lato text-xs">{toast}</div>}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <label className="flex items-center gap-2 font-lato text-sm text-w-950">
        <input type="checkbox" checked={shareNotes} onChange={(e) => setShareNotes(e.target.checked)} />
        Share session notes with me in Session History
      </label>

      <label className="flex items-center gap-2 font-lato text-sm text-w-950">
        <input type="checkbox" checked={allowContact} onChange={(e) => setAllowContact(e.target.checked)} />
        Allow staff to contact me about upcoming sessions
      </label>

      <div>
        <FieldLabel htmlFor="emergencyName">Emergency Contact Name</FieldLabel>
        <FormInput id="emergencyName" type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
      </div>

      <div>
        <FieldLabel htmlFor="emergencyPhone">Emergency Contact Phone</FieldLabel>
        <FormInput id="emergencyPhone" type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
      </div>

      <ElegantButton type="submit" variant="primary" className="text-sm py-2">Save Settings</ElegantButton>
    </form>
  )
}
