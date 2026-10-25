'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, CheckCircle2, AlertCircle, Pencil, Send, Trash2, ExternalLink, Loader2, Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import type { SerializedPublication } from '@/lib/data/publications'

/** Status chips (theme tokens, light + dark). */
const STATUS: Record<string, { label: string; cls: string; hint: string }> = {
  DRAFT: { label: 'Draft', cls: 'border-border bg-muted text-muted-foreground', hint: 'Only you can see it. Submit it when ready.' },
  SUBMITTED: { label: 'In review', cls: 'border-warning/30 bg-warning/10 text-warning', hint: 'Waiting for a reviewer.' },
  UNDER_REVIEW: { label: 'In review', cls: 'border-warning/30 bg-warning/10 text-warning', hint: 'A reviewer is looking at it.' },
  APPROVED: { label: 'Approved', cls: 'border-info/30 bg-info/10 text-info', hint: 'Approved.' },
  REJECTED: { label: 'Sent back', cls: 'border-destructive/30 bg-destructive/10 text-destructive', hint: 'See the reviewer’s note, edit and submit again.' },
  PUBLISHED: { label: 'Published', cls: 'border-success/30 bg-success/10 text-success', hint: 'Members can find it in the library.' },
}
const EDITABLE = ['DRAFT', 'REJECTED']
const WITHDRAWABLE = ['DRAFT', 'SUBMITTED', 'REJECTED']

/** The publisher's own books: status, reviewer notes, and edit / submit / withdraw / open in library. */
export function MySubmissionsView({ initialPublications, justDone }: { initialPublications: SerializedPublication[]; justDone: 'submitted' | 'saved' | null }) {
  const [rows, setRows] = useState(initialPublications)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState<SerializedPublication | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(
    justDone === 'submitted' ? { ok: true, text: 'Book submitted. You’ll be notified when a reviewer decides.' } : justDone === 'saved' ? { ok: true, text: 'Draft saved.' } : null,
  )

  const act = async (p: SerializedPublication, action: 'submit' | 'withdraw') => {
    setBusyId(p.id)
    setToast(null)
    try {
      const res = await fetch(`/api/publications/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong')
      if (action === 'withdraw') setRows((r) => r.filter((x) => x.id !== p.id))
      else setRows((r) => r.map((x) => (x.id === p.id ? json.data : x)))
      setToast({ ok: true, text: action === 'withdraw' ? `“${p.title}” withdrawn.` : `“${p.title}” submitted for review.` })
    } catch (err) {
      setToast({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setBusyId(null)
      setWithdrawing(null)
    }
  }

  const columns: Column<SerializedPublication>[] = [
    {
      key: 'title', label: 'Book', sortable: true,
      render: (p) => (
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
            <RemoteImage src={p.coverImage} alt="" fill sizes="40px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><BookOpen className="size-4" /></div>} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{p.title}</p>
            <p className="truncate text-xs text-muted-foreground">{p.category || 'No KCS category yet'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (p) => {
        const s = STATUS[p.status] ?? STATUS.DRAFT
        return (
          <div className="max-w-[280px]">
            <Badge variant="outline" className={s.cls}>{s.label}</Badge>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
            {p.status === 'REJECTED' && p.reviewNotes && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-foreground">“{p.reviewNotes}”</p>}
          </div>
        )
      },
    },
    { key: 'submittedAt', label: 'Last change', sortable: true, render: (p) => <span className="whitespace-nowrap text-xs text-muted-foreground">{p.submittedAt}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (p) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {EDITABLE.includes(p.status) && (
            <>
              <Link href={`/dashboard/publishing/submit?edit=${p.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}><Pencil /> Edit</Link>
              <Button size="sm" disabled={busyId === p.id} onClick={() => act(p, 'submit')}>
                {busyId === p.id ? <Loader2 className="animate-spin" /> : <Send />} Submit
              </Button>
            </>
          )}
          {p.status === 'PUBLISHED' && p.resourceId && (
            <Link href={`/library/${p.resourceId}`} target="_blank" className={buttonVariants({ variant: 'outline', size: 'sm' })}><ExternalLink /> View in library</Link>
          )}
          {WITHDRAWABLE.includes(p.status) && (
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={busyId === p.id} onClick={() => setWithdrawing(p)} aria-label={`Withdraw ${p.title}`}>
              <Trash2 /> Withdraw
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {toast && (
        <div role="status" className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-sm', toast.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
          {toast.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />} {toast.text}
        </div>
      )}
      <div className="flex justify-end">
        <Link href="/dashboard/publishing/submit" className={buttonVariants()}><Plus /> Submit a Book</Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={BookOpen} title="No books yet" description="Use “Submit a Book” to add your first book. It goes to review before members can see it." />
      ) : (
        <DataTable<SerializedPublication>
          data={rows}
          columns={columns}
          rowKey={(p) => p.id}
          searchPlaceholder="Search your books..."
          searchFilter={(p, q) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)}
          emptyMessage="No books match your search."
        />
      )}

      <Modal open={!!withdrawing} onClose={() => setWithdrawing(null)} title="Withdraw Book" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Withdraw <span className="font-semibold text-foreground">“{withdrawing?.title}”</span>? It is removed from review and from your list.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWithdrawing(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busyId === withdrawing?.id} onClick={() => withdrawing && act(withdrawing, 'withdraw')}>
              {busyId === withdrawing?.id && <Loader2 className="animate-spin" />} Withdraw
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
