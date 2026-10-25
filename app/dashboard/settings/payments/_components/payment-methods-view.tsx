'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Copy, CreditCard, Loader2, Pencil, RefreshCw, Smartphone, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Switch } from '@/components/ui/switch'
import { LocalDate } from '@/components/ui/local-date'
import type { PaymentMethodAdmin, PaymentMethodCode } from '@/lib/payments/shared'

export interface RecentAttempt {
  id: string
  provider: PaymentMethodCode
  targetKind: string
  reference: string
  amountRwf: number
  phone: string | null
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  providerStatus: string | null
  failureReason: string | null
  createdAt: string
}

interface Props {
  initialMethods: PaymentMethodAdmin[]
  recent: RecentAttempt[]
  webhooks: Partial<Record<PaymentMethodCode, string>>
}

const PROVIDER_NAME: Record<PaymentMethodCode, string> = {
  PAYPACK: 'PayPack', STRIPE: 'Stripe', INTOUCH: 'IntouchPay', MTN_MOMO: 'MTN MoMo API', PESAPAL: 'PesaPal', URUBUTOPAY: 'UrubutoPay',
}
const TARGET_NAME: Record<string, string> = { CHECKOUT: 'Library order', ORDER: 'Library item', COURSE_ORDER: 'Course', DONATION: 'Donation', PRODUCT_ORDER: 'Shop order' }

async function patch(method: string, body: unknown) {
  const res = await fetch(`/api/payments/methods/${method}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save')
  return json.data as PaymentMethodAdmin
}

/**
 * Payment method switches. A method is offered to payers only when it is
 * switched on here AND its credentials are in the server environment (the
 * card lists the missing variable names — never values). Balances are asked
 * on demand so the page never waits on four providers.
 */
export function PaymentMethodsView({ initialMethods, recent, webhooks }: Props) {
  const [methods, setMethods] = useState(initialMethods)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [editing, setEditing] = useState<PaymentMethodAdmin | null>(null)
  const [draft, setDraft] = useState({ label: '', description: '', sortOrder: 0 })
  const [balances, setBalances] = useState<{ method: string; balance: number | null; currency: string; error: string | null }[] | null>(null)
  const [loadingBalances, setLoadingBalances] = useState(false)

  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 4000) }
  const replace = (m: PaymentMethodAdmin) => setMethods((list) => list.map((x) => (x.method === m.method ? m : x)).sort((a, b) => a.sortOrder - b.sortOrder))

  const toggle = async (m: PaymentMethodAdmin, on: boolean) => {
    setBusy(m.method)
    try { replace(await patch(m.method, { enabled: on })); flash(true, `${m.label} ${on ? 'is now offered to payers' : 'is hidden from payers'}`) }
    catch (e) { flash(false, e instanceof Error ? e.message : 'Could not save') }
    finally { setBusy(null) }
  }

  const saveEdit = async () => {
    if (!editing) return
    setBusy(editing.method)
    try { replace(await patch(editing.method, { label: draft.label, description: draft.description || null, sortOrder: draft.sortOrder })); setEditing(null); flash(true, 'Saved') }
    catch (e) { flash(false, e instanceof Error ? e.message : 'Could not save') }
    finally { setBusy(null) }
  }

  const loadBalances = async () => {
    setLoadingBalances(true)
    try {
      const json = await fetch('/api/payments/balances').then((r) => r.json())
      setBalances(json.data ?? [])
    } catch { flash(false, 'Could not load balances') } finally { setLoadingBalances(false) }
  }

  const copy = (text: string) => { navigator.clipboard?.writeText(text).then(() => flash(true, 'Copied')).catch(() => {}) }
  const offered = methods.filter((m) => m.enabled && m.configured).length

  return (
    <div className="space-y-6">
      {toast && (
        <div role="status" className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${toast.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />} {toast.text}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{offered}</span> method{offered === 1 ? '' : 's'} offered at checkout (library orders, courses, donations and the shop). A method needs to be switched on <em>and</em> have its credentials set on the server.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {methods.map((m) => (
          <div key={m.method} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {m.kind === 'mobile' ? <Smartphone className="size-4" /> : <CreditCard className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{PROVIDER_NAME[m.method]} · {m.kind === 'mobile' ? 'phone prompt' : 'payment page'}</p>
              </div>
              <Switch checked={m.enabled} disabled={busy === m.method || (!m.configured && !m.enabled)} onCheckedChange={(on) => toggle(m, on)} aria-label={`Offer ${m.label}`} />
            </div>
            {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
            <div className="flex flex-wrap gap-1.5">
              {m.configured ? <Badge variant="secondary">Credentials set</Badge> : <Badge variant="destructive">Not configured</Badge>}
              {m.mode && <Badge variant="outline">{m.mode}</Badge>}
              {m.enabled && m.configured && <Badge>Offered</Badge>}
            </div>
            {!m.configured && (
              <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">Add to the server environment: <span className="font-mono text-foreground">{m.missingEnv.join(', ')}</span></p>
            )}
            {webhooks[m.method] && (
              <button type="button" onClick={() => copy(webhooks[m.method]!)} className="flex items-center gap-1.5 truncate text-left text-xs text-muted-foreground hover:text-foreground" title="Copy callback URL">
                <Copy className="size-3 shrink-0" /> <span className="truncate font-mono">{webhooks[m.method]}</span>
              </button>
            )}
            <div className="mt-auto">
              <Button variant="outline" size="sm" onClick={() => { setEditing(m); setDraft({ label: m.label, description: m.description ?? '', sortOrder: m.sortOrder }) }}>
                <Pencil /> Edit name
              </Button>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-foreground"><Wallet className="size-4" /> Merchant balances</h2>
          <Button variant="outline" size="sm" onClick={loadBalances} disabled={loadingBalances}>{loadingBalances ? <Loader2 className="animate-spin" /> : <RefreshCw />} {balances ? 'Refresh' : 'Check balances'}</Button>
        </div>
        {balances && (
          balances.length === 0
            ? <p className="mt-3 text-sm text-muted-foreground">No configured provider reports a balance (InTouch, MTN MoMo, UrubutoPay do).</p>
            : <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {balances.map((b) => (
                  <li key={b.method} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">{PROVIDER_NAME[b.method as PaymentMethodCode] ?? b.method}</p>
                    {b.error ? <p className="text-sm text-destructive">{b.error}</p> : <p className="text-lg font-bold tabular-nums text-foreground" suppressHydrationWarning>{(b.balance ?? 0).toLocaleString()} {b.currency}</p>}
                  </li>
                ))}
              </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <h2 className="font-semibold text-foreground">Latest provider transactions</h2>
        <p className="text-xs text-muted-foreground">InTouch, MTN MoMo, PesaPal and UrubutoPay. Each result is confirmed with the provider before an order is marked paid.</p>
        {recent.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">None yet.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3">When</th><th className="pr-3">Provider</th><th className="pr-3">For</th><th className="pr-3">Reference</th><th className="pr-3 text-right">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap"><LocalDate value={a.createdAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} /></td>
                    <td className="pr-3">{PROVIDER_NAME[a.provider]}</td>
                    <td className="pr-3">{TARGET_NAME[a.targetKind] ?? a.targetKind}</td>
                    <td className="pr-3 font-mono text-xs">{a.reference}</td>
                    <td className="pr-3 text-right tabular-nums" suppressHydrationWarning>{a.amountRwf.toLocaleString()} RWF</td>
                    <td>
                      <Badge variant={a.status === 'SUCCESSFUL' ? 'secondary' : a.status === 'FAILED' ? 'destructive' : 'outline'}>{a.status.toLowerCase()}</Badge>
                      {a.failureReason && <span className="ml-1 text-xs text-muted-foreground">{a.failureReason}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!editing} onClose={() => busy ? undefined : setEditing(null)} title="Edit payment method" size="md">
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="pm-label">Name payers see</Label><Input id="pm-label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} maxLength={60} /></div>
          <div className="space-y-1.5"><Label htmlFor="pm-desc">Short description</Label><Input id="pm-desc" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={160} /></div>
          <div className="space-y-1.5"><Label htmlFor="pm-order">Position (lower shows first)</Label><Input id="pm-order" type="number" min={0} max={999} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={!!busy}>Cancel</Button>
            <Button onClick={saveEdit} disabled={!!busy || draft.label.trim().length < 2}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
