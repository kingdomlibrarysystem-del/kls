'use client'

import { useState } from 'react'
import { AlertCircle, CalendarDays, Repeat } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  DAILY_WISDOM_LANGUAGES,
  VERSE_REFERENCE_MAX,
  VERSE_TEXT_MAX,
  localDateKey,
  type DailyVerseItem,
  type DailyWisdomLanguage,
} from '@/lib/daily-wisdom-shared'
import { LANGUAGE_NAMES } from './language-names'

export type VerseKind = 'sent' | 'automatic'

interface VerseFormModalProps {
  /** Verse being edited, or null when adding. */
  editing: DailyVerseItem | null
  /** For a new verse: which kind the form starts on. */
  initialKind: VerseKind
  onClose: () => void
  onSaved: (saved: DailyVerseItem, wasEditing: boolean) => void
}

const selectCls = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

/**
 * Add / edit one verse. "Send for a day" pins it to a date (it replaces the
 * automatic verse that day, in that language); "Automatic rotation" adds it
 * to the pool the site picks from on days nobody sent one. Mounted only while
 * open (keyed by the parent), so it starts from the right values without an effect.
 */
export function VerseFormModal({ editing, initialKind, onClose, onSaved }: VerseFormModalProps) {
  const [kind, setKind] = useState<VerseKind>(editing ? (editing.scheduledDate ? 'sent' : 'automatic') : initialKind)
  const [text, setText] = useState(editing?.text ?? '')
  const [reference, setReference] = useState(editing?.reference ?? '')
  const [language, setLanguage] = useState<DailyWisdomLanguage>(editing?.language ?? 'en')
  const [date, setDate] = useState(editing?.scheduledDate ?? localDateKey())
  const [active, setActive] = useState(editing?.active ?? true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim().length < 5) { setError('Write the verse (at least 5 characters)'); return }
    if (reference.trim().length < 2) { setError('Add the reference, e.g. John 3:16'); return }
    if (kind === 'sent' && !date) { setError('Pick the day this verse is for'); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(editing ? `/api/daily-wisdom/verses/${editing.id}` : '/api/daily-wisdom/verses', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), reference: reference.trim(), language, scheduledDate: kind === 'sent' ? date : null, active }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save the verse')
      onSaved(json.data as DailyVerseItem, !!editing)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the verse')
    } finally {
      setSaving(false)
    }
  }

  const kindButton = (value: VerseKind, icon: React.ReactNode, label: string, hint: string) => (
    <button
      type="button"
      onClick={() => setKind(value)}
      aria-pressed={kind === value}
      className={cn(
        'flex flex-1 items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
        kind === value ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
      )}
    >
      <span className={cn('mt-0.5 [&_svg]:size-4', kind === value ? 'text-primary' : 'text-muted-foreground')}>{icon}</span>
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  )

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit Verse' : kind === 'sent' ? 'Send a Daily Verse' : 'Add Automatic Verse'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {kindButton('sent', <CalendarDays />, 'Send for a day', 'Shown on that day instead of the automatic verse.')}
          {kindButton('automatic', <Repeat />, 'Automatic rotation', 'Picked automatically on days nobody sent a verse.')}
        </div>

        <div className={cn('grid gap-4', kind === 'sent' ? 'sm:grid-cols-2' : '')}>
          {kind === 'sent' && (
            <div className="space-y-1.5">
              <Label htmlFor="verse-date">Day</Label>
              <Input id="verse-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="verse-language">Language</Label>
            <select id="verse-language" value={language} onChange={(e) => setLanguage(e.target.value as DailyWisdomLanguage)} className={selectCls}>
              {DAILY_WISDOM_LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_NAMES[l]}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verse-text">Verse</Label>
          <Textarea id="verse-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={VERSE_TEXT_MAX} placeholder="For God so loved the world…" autoFocus />
          <p className="text-right text-xs text-muted-foreground">{text.length}/{VERSE_TEXT_MAX}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verse-reference">Reference</Label>
          <Input id="verse-reference" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={VERSE_REFERENCE_MAX} placeholder="John 3:16" />
        </div>

        <label htmlFor="verse-active" className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5">
          <span>
            <span className="block text-sm font-medium text-foreground">Active</span>
            <span className="block text-xs text-muted-foreground">Switched off, the verse is kept but never shown.</span>
          </span>
          <Switch id="verse-active" checked={active} onCheckedChange={setActive} />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : kind === 'sent' ? 'Send Verse' : 'Add Verse'}</Button>
        </div>
      </form>
    </Modal>
  )
}
