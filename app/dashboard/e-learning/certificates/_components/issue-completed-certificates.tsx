'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Award, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocalDate } from '@/components/ui/local-date'
import type { PendingCertificate } from '@/lib/certificates/issue'
import { refetchCertificatesAdmin } from './use-certificates-admin'

/**
 * "Process certificates": every member who completed a course but has no
 * certificate yet, with one button to issue them all (each member is
 * notified). Members who finished without passing a final exam are marked,
 * so the admin can see it before issuing.
 */
export function IssueCompletedCertificates({ initialPending }: { initialPending: PendingCertificate[] }) {
  const router = useRouter()
  const [pending, setPending] = useState(initialPending)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [showAll, setShowAll] = useState(false)

  const issueAll = async () => {
    setBusy(true); setMessage(null)
    try {
      const res = await fetch('/api/certificates/issue-completed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not issue certificates')
      setMessage({ ok: true, text: json.message })
      setPending([])
      await refetchCertificatesAdmin()
      router.refresh()
    } catch (e) { setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not issue certificates' }) } finally { setBusy(false) }
  }

  const shown = showAll ? pending : pending.slice(0, 6)
  const noExam = pending.filter((p) => !p.assessmentPassed).length

  return (
    <section className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-4 shadow-xs">
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Award className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground">Process certificates</h2>
          <p className="text-sm text-muted-foreground">
            {pending.length === 0
              ? 'Every member who completed a course has a certificate.'
              : `${pending.length} member${pending.length === 1 ? '' : 's'} completed a course and ${pending.length === 1 ? 'has' : 'have'} no certificate yet.`}
            {noExam > 0 && ` ${noExam} of them did not pass a final exam (or the course has none).`}
          </p>
        </div>
        {pending.length > 0 && (
          <Button onClick={issueAll} disabled={busy}>
            {busy ? <><Loader2 className="animate-spin" /> Issuing…</> : <>Issue {pending.length === 1 ? 'the certificate' : `all ${pending.length} certificates`}</>}
          </Button>
        )}
      </div>

      {message && (
        <p role="status" className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${message.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
          {message.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />} {message.text}
        </p>
      )}

      {pending.length > 0 && (
        <>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {shown.map((p) => (
              <li key={p.enrollmentId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{p.memberName}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.courseTitle}</span>
                {!p.assessmentPassed && <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">no exam passed</span>}
                <span className="text-xs text-muted-foreground">completed <LocalDate value={p.completedAt} /></span>
              </li>
            ))}
          </ul>
          {pending.length > 6 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-sm font-medium text-primary hover:underline">
              {showAll ? 'Show less' : `Show all ${pending.length}`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
