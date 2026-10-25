'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Percent, Pencil, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CommissionRateCardProps {
  /** Current platform commission in percent. */
  percent: number
  /** Only an admin can change it. */
  canEdit: boolean
  className?: string
}

/**
 * The platform commission on every sale/rental of a publisher's book (the
 * publisher earns the rest). Admins change it here; books approved after the
 * change use the new rate, and "apply to published books" also updates the
 * split of books already in the library. Saved on the server
 * (PUT /api/publishing/commission → Settings.publishingCommissionPercent).
 */
export function CommissionRateCard({ percent, canEdit, className }: CommissionRateCardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(String(percent))
  const [applyToPublished, setApplyToPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const parsed = Number(value)
  const valid = value.trim() !== '' && Number.isInteger(parsed) && parsed >= 0 && parsed <= 100

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) { setError('Enter a whole number from 0 to 100'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/publishing/commission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent: parsed, applyToPublished }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save the commission')
      setSaved(json.message)
      setOpen(false)
      router.refresh()
      setTimeout(() => setSaved(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the commission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-xs', className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Percent className="size-5" /></span>
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground">COMMISSION ON BOOK SALES</p>
          <p className="text-sm text-foreground">
            Platform keeps <span className="font-cinzel text-lg font-bold text-primary">{percent}%</span> · publisher earns{' '}
            <span className="font-semibold">{100 - percent}%</span> of every sale or rental
          </p>
          {saved && <p role="status" className="mt-1 flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-3.5" /> {saved}</p>}
        </div>
      </div>
      {canEdit ? (
        <Button variant="outline" onClick={() => { setValue(String(percent)); setApplyToPublished(false); setError(''); setOpen(true) }}>
          <Pencil /> Set commission rate
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Set by an admin</span>
      )}

      <Modal open={open} onClose={() => { if (!saving) setOpen(false) }} title="Set Commission Rate" size="sm">
        <form onSubmit={save} className="space-y-4">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="commission-percent">Platform commission (%)</Label>
            <Input id="commission-percent" type="number" min={0} max={100} step={1} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
            <p className="text-xs text-muted-foreground">
              {valid ? <>On a 10,000 RWF sale the platform keeps {(100 * parsed).toLocaleString()} RWF and the publisher earns {(100 * (100 - parsed)).toLocaleString()} RWF.</> : 'A whole number from 0 to 100.'}
            </p>
          </div>
          <label className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" checked={applyToPublished} onChange={(e) => setApplyToPublished(e.target.checked)} className="mt-0.5 size-4 accent-[var(--gold)]" />
            <span>
              <span className="font-medium text-foreground">Also apply to books already published</span>
              <span className="block text-xs text-muted-foreground">Otherwise only books approved from now on use the new rate.</span>
            </span>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !valid}>{saving && <Loader2 className="animate-spin" />} {saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
