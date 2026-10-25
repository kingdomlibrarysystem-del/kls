'use client'

import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { counselingModeLabels, type CounselingSession } from '../../_shared/counseling-data'

/** "YYYY-MM-DDTHH:mm" in local time for a datetime-local input. */
function localInput(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

interface Props {
  session: CounselingSession
  action: 'confirm' | 'cancel'
  onClose: () => void
  onSubmit: (extra: { meetingDetails?: string; note?: string; proposedTime?: string }) => Promise<void>
}

/**
 * Confirm: optionally move the time, add the video link (video call) or the
 * place (in person) — for a phone session the member's number is shown — and
 * a note. Cancel: the reason. The member is notified with these details.
 */
export function ConfirmSessionModal({ session, action, onClose, onSubmit }: Props) {
  const [time, setTime] = useState(localInput(session.proposedTime))
  const [details, setDetails] = useState(session.meetingDetails ?? '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirm = action === 'confirm'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirm && session.mode === 'VIRTUAL' && !details.trim()) { setError('Add the video call link the member will use'); return }
    if (!confirm && note.trim().length < 3) { setError('Tell the member why it is cancelled'); return }
    setBusy(true)
    setError('')
    try {
      const moved = confirm && time !== localInput(session.proposedTime)
      await onSubmit({
        ...(confirm && details.trim() && { meetingDetails: details.trim() }),
        ...(note.trim() && { note: note.trim() }),
        ...(moved && { proposedTime: new Date(time).toISOString() }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the session')
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={() => { if (!busy) onClose() }} title={confirm ? 'Confirm session' : 'Cancel session'} size="md">
      <form onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <p><span className="font-medium">{session.memberName}</span> with {session.counselorName} · {counselingModeLabels[session.mode] ?? session.mode}</p>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">“{session.reason}”</p>
          {session.mode === 'PHONE' && session.contactPhone && <p className="mt-1">Number to call: <a href={`tel:${session.contactPhone}`} className="font-semibold underline">{session.contactPhone}</a></p>}
        </div>
        {confirm && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-time">Time</Label>
              <Input id="confirm-time" type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} />
              <p className="text-xs text-muted-foreground">Change it if you agreed another time with the member.</p>
            </div>
            {session.mode !== 'PHONE' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-details">{session.mode === 'VIRTUAL' ? 'Video call link' : 'Place'}</Label>
                <Input id="confirm-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder={session.mode === 'VIRTUAL' ? 'https://meet.google.com/…' : 'e.g. Counseling room 2, Kingdom Library'} />
              </div>
            )}
          </>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-note">{confirm ? 'Note to the member (optional)' : 'Reason (sent to the member)'}</Label>
          <Textarea id="confirm-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Back</Button>
          <Button type="submit" variant={confirm ? 'default' : 'destructive'} disabled={busy}>{busy && <Loader2 className="animate-spin" />} {confirm ? 'Confirm & notify' : 'Cancel & notify'}</Button>
        </div>
      </form>
    </Modal>
  )
}
