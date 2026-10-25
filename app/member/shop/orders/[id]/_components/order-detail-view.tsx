'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, CheckCircle2, Loader2, RefreshCw, ShoppingBag, Smartphone, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LocalDate } from '@/components/ui/local-date'
import { RemoteImage } from '@/components/ui/remote-image'
import { ORDER_STATUS, formatRwf, orderSteps, type ShopOrder } from '@/lib/shop/shared'
import { cn } from '@/lib/utils'

const POLL_MS = 5000
const POLL_FOR_MS = 3 * 60 * 1000

/**
 * Order page. While the payment is pending it checks the payment provider
 * every few seconds (for up to 3 minutes, then on demand), so the page turns
 * "Paid" by itself once the member approves the prompt on their phone.
 */
export function OrderDetailView({ initialOrder, justPlaced, returnedFromCard }: { initialOrder: ShopOrder; justPlaced: boolean; returnedFromCard: boolean }) {
  const [order, setOrder] = useState(initialOrder)
  const [busy, setBusy] = useState<'check' | 'retry' | 'cancel' | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    justPlaced && initialOrder.status === 'PENDING_PAYMENT' && initialOrder.method === 'PAYPACK'
      ? { ok: true, text: `Payment request sent to ${initialOrder.buyerPhone}. Approve it on your phone — this page updates by itself.` }
      : null,
  )
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [polling, setPolling] = useState(initialOrder.status === 'PENDING_PAYMENT')
  /** When the current round of automatic checks began (set when polling starts). */
  const started = useRef(0)

  const act = useCallback(async (action: 'check' | 'retry' | 'cancel', quiet = false) => {
    if (!quiet) setBusy(action)
    try {
      const res = await fetch(`/api/shop/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong')
      if (json.data?.checkoutUrl) { window.location.href = json.data.checkoutUrl; return }
      setOrder(json.data)
      if (!quiet) setMessage({ ok: true, text: json.message })
      if (action === 'retry') setPolling(true)
    } catch (err) {
      if (!quiet) setMessage({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      if (!quiet) setBusy(null)
    }
  }, [order.id])

  // Automatic payment check (external payment provider — an effect is the right tool).
  useEffect(() => {
    if (!polling || order.status !== 'PENDING_PAYMENT') return
    started.current = Date.now()
    const tick = () => {
      if (Date.now() - started.current > POLL_FOR_MS) { setPolling(false); return }
      act('check', true)
    }
    // Back from the card page: check at once; otherwise give the member time to approve first.
    const first = setTimeout(tick, returnedFromCard ? 0 : POLL_MS)
    const id = setInterval(tick, POLL_MS)
    return () => { clearTimeout(first); clearInterval(id) }
  }, [polling, order.status, act, returnedFromCard])

  const s = ORDER_STATUS[order.status]
  const steps = orderSteps(order.deliveryMethod)
  const reached = steps.indexOf(order.status)
  const ended = order.status === 'CANCELLED' || order.status === 'FAILED'

  return (
    <div className="space-y-5">
      {message && (
        <p role="status" className={cn('flex items-start gap-2 rounded-md border px-3 py-2 text-sm', message.ok ? 'border-success/30 bg-success/10 text-foreground' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
          {message.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />} {message.text}
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Order <span className="font-semibold text-foreground">{order.orderNumber}</span> · <LocalDate value={order.createdAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} /></p>
            <Badge variant="outline" className={cn('mt-2', s.cls)}>{s.label}</Badge>
            <p className="mt-1 text-sm text-muted-foreground">{s.hint}</p>
            {order.staffNote && <p className="mt-2 rounded-md bg-muted px-3 py-2 text-sm text-foreground">Note from the shop: {order.staffNote}</p>}
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{formatRwf(order.totalRwf)}</p>
        </div>

        {!ended && (
          <ol className="mt-5 grid grid-cols-5 gap-1" aria-label="Order progress">
            {steps.map((step, i) => {
              const done = i <= reached
              return (
                <li key={step} className="flex flex-col items-center gap-1 text-center">
                  <span className={cn('flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold', done ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}>
                    {done ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className={cn('text-[11px] leading-tight', done ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{ORDER_STATUS[step].label}</span>
                </li>
              )
            })}
          </ol>
        )}

        {order.status === 'PENDING_PAYMENT' && (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center">
            <Smartphone className="size-6 shrink-0 text-warning" />
            <div className="flex-1 text-sm">
              {order.method === 'PAYPACK'
                ? <>Approve the payment of <b>{formatRwf(order.totalRwf)}</b> on <b>{order.buyerPhone}</b> (dial *182*7*1# on MTN if no prompt appears).</>
                : <>Finish paying on the card page.</>}
              {polling && <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Waiting for the payment…</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={!!busy} onClick={() => act('check')}>{busy === 'check' ? <Loader2 className="animate-spin" /> : <RefreshCw />} I&apos;ve paid — check</Button>
              <Button size="sm" disabled={!!busy} onClick={() => act('retry')}>{busy === 'retry' ? <Loader2 className="animate-spin" /> : <Smartphone />} {order.method === 'PAYPACK' ? 'Send the request again' : 'Open card page'}</Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card shadow-xs">
        <h2 className="border-b border-border px-5 py-3 text-sm font-bold text-foreground">Items</h2>
        <ul className="divide-y divide-border">
          {order.items.map((i, n) => (
            <li key={n} className="flex items-center gap-3 px-5 py-3">
              <Link href={`/member/shop/${i.productId}`} className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <RemoteImage src={i.image} alt={i.title} fill sizes="56px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-4" /></div>} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{i.title}</p>
                <p className="text-xs text-muted-foreground">{i.quantity} × {formatRwf(i.unitPriceRwf)}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatRwf(i.unitPriceRwf * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-border px-5 py-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatRwf(order.subtotalRwf)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">{order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</dt><dd className="tabular-nums">{order.deliveryFeeRwf > 0 ? formatRwf(order.deliveryFeeRwf) : 'Free'}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd className="tabular-nums">{formatRwf(order.totalRwf)}</dd></div>
        </dl>
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-5 text-sm shadow-xs sm:grid-cols-2">
        <div>
          <h3 className="mb-1 font-semibold text-foreground">{order.deliveryMethod === 'DELIVERY' ? 'Delivery to' : 'Pickup'}</h3>
          <p className="whitespace-pre-line text-muted-foreground">{order.deliveryMethod === 'DELIVERY' ? order.deliveryAddress : 'At the Kingdom Library — we will notify you when it is ready.'}</p>
        </div>
        <div>
          <h3 className="mb-1 font-semibold text-foreground">Contact &amp; payment</h3>
          <p className="text-muted-foreground">{order.buyerName} · {order.buyerPhone || order.buyerEmail}</p>
          <p className="text-muted-foreground">{order.method === 'PAYPACK' ? 'Mobile money' : 'Card'}{order.paidAt && <> · paid <LocalDate value={order.paidAt} options={{ dateStyle: 'medium' }} /></>}</p>
          {order.notes && <p className="mt-1 text-muted-foreground">Your note: {order.notes}</p>}
        </div>
      </section>

      <div className="flex flex-wrap justify-between gap-2">
        <Link href="/member/shop/orders" className="text-sm text-primary hover:underline">← All my orders</Link>
        {order.status === 'PENDING_PAYMENT' && (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={!!busy} onClick={() => setConfirmCancel(true)}><XCircle /> Cancel order</Button>
        )}
      </div>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this order?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Order {order.orderNumber} has not been paid. Cancelling it gives the products back to the shop.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>Keep it</Button>
            <Button variant="destructive" disabled={busy === 'cancel'} onClick={async () => { await act('cancel'); setConfirmCancel(false) }}>{busy === 'cancel' && <Loader2 className="animate-spin" />} Cancel order</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
