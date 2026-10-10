'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { CalendarDays, Repeat, Pencil, Trash2, CheckCircle2, AlertCircle, BookHeart, Send, Plus } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DAILY_WISDOM_LANGUAGES,
  localDateKey,
  pickTodayVerse,
  type DailyVerseItem,
} from '@/lib/daily-wisdom-shared'
import { LANGUAGE_NAMES } from './language-names'
import { VerseFormModal, type VerseKind } from './verse-form-modal'

const noopSubscribe = () => () => {}

/** "2026-10-14" -> "Wed, 14 Oct 2026" in the viewer's locale (parsed as a calendar day, not a UTC instant). */
function dayLabel(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Daily Wisdom management. Top: what each language shows TODAY (same rule the
 * header uses). Then two tabs — verses SENT for a specific day, and the
 * AUTOMATIC rotation used on days nobody sent one. Starts from server data;
 * each change updates the list from the API response.
 */
export function DailyWisdomView({ initialVerses }: { initialVerses: DailyVerseItem[] }) {
  const [verses, setVerses] = useState(initialVerses)
  const [form, setForm] = useState<{ editing: DailyVerseItem | null; kind: VerseKind } | null>(null)
  const [deleting, setDeleting] = useState<DailyVerseItem | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  // The admin's own local date — null during server rendering, so "today" never mismatches on hydration.
  const today = useSyncExternalStore(noopSubscribe, () => localDateKey(), () => null)

  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500) }

  const sent = useMemo(() => verses.filter((v) => v.scheduledDate).sort((a, b) => (b.scheduledDate ?? '').localeCompare(a.scheduledDate ?? '')), [verses])
  const automatic = useMemo(() => verses.filter((v) => !v.scheduledDate), [verses])

  const handleSaved = (saved: DailyVerseItem, wasEditing: boolean) => {
    setVerses((list) => (wasEditing ? list.map((v) => (v.id === saved.id ? saved : v)) : [saved, ...list]))
    setForm(null)
    flash(true, wasEditing ? 'Verse updated' : saved.scheduledDate ? `Verse sent for ${dayLabel(saved.scheduledDate)}` : 'Verse added to the automatic rotation')
  }

  const toggleActive = async (v: DailyVerseItem, active: boolean) => {
    setBusyId(v.id)
    try {
      const res = await fetch(`/api/daily-wisdom/verses/${v.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not update the verse')
      setVerses((list) => list.map((x) => (x.id === v.id ? json.data : x)))
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Could not update the verse')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setBusyId(deleting.id)
    try {
      const res = await fetch(`/api/daily-wisdom/verses/${deleting.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not delete the verse')
      setVerses((list) => list.filter((x) => x.id !== deleting.id))
      flash(true, 'Verse deleted')
      setDeleting(null)
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Could not delete the verse')
    } finally {
      setBusyId(null)
    }
  }

  const verseCell = (v: DailyVerseItem) => (
    <div className="min-w-[240px] max-w-[460px]">
      <p className="line-clamp-2 text-sm italic text-foreground">« {v.text} »</p>
      <p className="mt-0.5 text-xs font-semibold text-primary">— {v.reference}</p>
    </div>
  )
  const commonColumns: Column<DailyVerseItem>[] = [
    { key: 'language', label: 'Language', sortable: true, render: (v) => <Badge variant="outline">{LANGUAGE_NAMES[v.language]}</Badge> },
    {
      key: 'active', label: 'Active',
      render: (v) => <Switch checked={v.active} disabled={busyId === v.id} onCheckedChange={(on) => toggleActive(v, on)} aria-label={v.active ? 'Switch off' : 'Switch on'} />,
    },
    { key: 'createdByName', label: 'Added by', sortable: true, render: (v) => <span className="text-xs text-muted-foreground">{v.createdByName}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (v) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setForm({ editing: v, kind: v.scheduledDate ? 'sent' : 'automatic' })}><Pencil /> Edit</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(v)} aria-label="Delete verse"><Trash2 /></Button>
        </div>
      ),
    },
  ]
  const sentColumns: Column<DailyVerseItem>[] = [
    {
      key: 'scheduledDate', label: 'Day', sortable: true,
      render: (v) => (
        <div className="whitespace-nowrap">
          <p suppressHydrationWarning className="text-sm font-medium text-foreground">{dayLabel(v.scheduledDate!)}</p>
          {today && v.scheduledDate === today && <Badge className="mt-1">Today</Badge>}
          {today && v.scheduledDate! > today && <Badge variant="secondary" className="mt-1">Upcoming</Badge>}
        </div>
      ),
    },
    { key: 'text', label: 'Verse', render: verseCell },
    ...commonColumns,
  ]
  const automaticColumns: Column<DailyVerseItem>[] = [{ key: 'text', label: 'Verse', render: verseCell }, ...commonColumns]

  return (
    <div className="space-y-4">
      {toast && (
        <div role="status" className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${toast.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
          {toast.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />} {toast.text}
        </div>
      )}

      {/* Today, per language — exactly what readers see in the header right now */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide text-primary"><BookHeart className="size-4" /> Showing today{today && <span suppressHydrationWarning className="font-normal text-muted-foreground">· {dayLabel(today)}</span>}</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setForm({ editing: null, kind: 'sent' })}><Send /> Send a Verse</Button>
            <Button variant="outline" onClick={() => setForm({ editing: null, kind: 'automatic' })}><Plus /> Add Automatic Verse</Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {DAILY_WISDOM_LANGUAGES.map((lang) => {
            const v = today ? pickTodayVerse(verses, today, lang) : null
            return (
              <div key={lang} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{LANGUAGE_NAMES[lang]}</span>
                  {v && (
                    <Badge variant={v.source === 'sent' ? 'default' : 'outline'} className="gap-1">
                      {v.source === 'sent' ? <><CalendarDays /> Sent</> : <><Repeat /> Automatic</>}
                    </Badge>
                  )}
                </div>
                {v ? (
                  <>
                    <p className="mt-2 line-clamp-3 text-sm italic text-foreground">« {v.text} »</p>
                    <p className="mt-1 text-xs font-semibold text-primary">— {v.reference}{v.language !== lang && <span className="font-normal text-muted-foreground"> ({LANGUAGE_NAMES[v.language]})</span>}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">{today ? 'No active verse — the header hides Daily Wisdom.' : '…'}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Tabs defaultValue="sent">
        <TabsList>
          <TabsTrigger value="sent"><CalendarDays /> Sent for a day ({sent.length})</TabsTrigger>
          <TabsTrigger value="automatic"><Repeat /> Automatic rotation ({automatic.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="sent" className="mt-3">
          <p className="mb-3 text-xs text-muted-foreground">A sent verse replaces the automatic one on its day, for readers using that language. One per day per language.</p>
          <DataTable<DailyVerseItem>
            data={sent}
            columns={sentColumns}
            rowKey={(v) => v.id}
            searchPlaceholder="Search verses or references..."
            searchFilter={(v, q) => v.text.toLowerCase().includes(q) || v.reference.toLowerCase().includes(q)}
            emptyMessage="No verse sent yet — use “Send a Verse”."
          />
        </TabsContent>
        <TabsContent value="automatic" className="mt-3">
          <p className="mb-3 text-xs text-muted-foreground">On days nobody sent a verse, the site shows one of these, changing every day at midnight and cycling through all active verses of the reader&apos;s language.</p>
          <DataTable<DailyVerseItem>
            data={automatic}
            columns={automaticColumns}
            rowKey={(v) => v.id}
            searchPlaceholder="Search verses or references..."
            searchFilter={(v, q) => v.text.toLowerCase().includes(q) || v.reference.toLowerCase().includes(q)}
            emptyMessage="No automatic verses yet."
          />
        </TabsContent>
      </Tabs>

      {form && (
        <VerseFormModal
          key={form.editing?.id ?? `new-${form.kind}`}
          editing={form.editing}
          initialKind={form.kind}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Verse" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{deleting?.reference}</span>
            {deleting?.scheduledDate ? <> sent for {dayLabel(deleting.scheduledDate)}</> : <> from the automatic rotation</>}? Switching it off keeps it instead.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busyId === deleting?.id}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
