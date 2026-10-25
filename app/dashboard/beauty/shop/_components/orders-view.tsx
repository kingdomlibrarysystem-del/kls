'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, Loader2, ShoppingBag } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { LocalDate } from '@/components/ui/local-date'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import { ORDER_STATUS, formatRwf, type OrderStatus, type ShopOrder } from '@/lib/shop/shared'

type Filter = 'todo' | 'PENDING_PAYMENT' | 'COMPLETED' | 'closed' | 'all'
const FILTERS: { key: Filter; label: string; match: (s: OrderStatus) => boolean }[] = [
  { key: 'todo', label: 'To fulfil', match: (s) => ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(s) },
  { key: 'PENDING_PAYMENT', label: 'Awaiting payment', match: (s) => s === 'PENDING_PAYMENT' },
  { key: 'COMPLETED', label: 'Completed', match: (s) => s === 'COMPLETED' },
  { key: 'closed', label: 'Cancelled / failed', match: (s) => s === 'CANCELLED' || s === 'FAILED' },
  { key: 'all', label: 'All', match: () => true },
]

/** The next step staff can take for an order, by status and delivery method. */
function nextSteps(o: ShopOrder): OrderStatus[] {
  switch (o.status) {
    case 'PAID': return ['PROCESSING']
    case 'PROCESSING': return [o.deliveryMethod === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'READY_FOR_PICKUP']
    case 'READY_FOR_PICKUP':
    case 'OUT_FOR_DELIVERY': return ['COMPLETED']
    default: return []
  }
}
const STEP_LABEL: Partial<Record<OrderStatus, string>> = {
  PROCESSING: 'Start preparing', READY_FOR_PICKUP: 'Mark ready for pickup', OUT_FOR_DELIVERY: 'Mark out for delivery', COMPLETED: 'Mark completed',
}

/** Shop orders for staff: filter by stage, open an order, move it along (the member is notified each time) or cancel it. */
export function OrdersView({ initialOrders }: { initialOrders: ShopOrder[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState<Filter>('todo')
  const [open, setOpen] = useState<ShopOrder | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const counts = useMemo(() => new Map(FILTERS.map((f) => [f.key, orders.filter((o) => f.match(o.status)).length])), [orders])
  const visible = orders.filter((o) => FILTERS.find((f) => f.key === filter)!.match(o.status))

  const act = async (o: ShopOrder, body: Record<string, unknown>, label: string) => {
    setBusy(label)
    setError('')
    try {
      const res = await fetch(`/api/shop/orders/${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not update the order')
      setOrders((list) => list.map((x) => (x.id === o.id ? json.data : x)))
      setOpen(json.data)
      setNote('')
      setToast(`Order ${o.orderNumber}: ${ORDER_STATUS[json.data.status as OrderStatus].label} — the member was notified.`)
      setTimeout(() => setToast(''), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the order')
    } finally {
      setBusy(null)
    }
  }

  const columns: Column<ShopOrder>[] = [
    {
      key: 'orderNumber', label: 'Order', sortable: true,
      render: (o) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-foreground">{o.orderNumber}</p>
          <p className="text-xs text-muted-foreground"><LocalDate value={o.createdAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} /></p>
        </div>
      ),
    },
    { key: 'buyerName', label: 'Member', sortable: true, render: (o) => <div><p className="text-foreground">{o.buyerName}</p><p className="text-xs text-muted-foreground">{o.buyerPhone || o.buyerEmail}</p></div> },
    { key: 'items', label: 'Items', render: (o) => <span className="text-sm text-muted-foreground">{o.items.reduce((n, i) => n + i.quantity, 0)} · {o.items[0]?.title}{o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</span> },
    { key: 'deliveryMethod', label: 'Get it by', render: (o) => <span className="text-sm">{o.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</span> },
    { key: 'totalRwf', label: 'Total', sortable: true, render: (o) => <span className="font-semibold tabular-nums">{formatRwf(o.totalRwf)}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (o) => <Badge variant="outline" className={ORDER_STATUS[o.status].cls}>{ORDER_STATUS[o.status].label}</Badge> },
    { key: 'actions', label: '', className: 'text-right', render: (o) => <Button variant="outline" size="sm" onClick={() => { setError(''); setNote(o.staffNote ?? ''); setOpen(o) }}><Eye /> Open</Button> },
  ]

  return (
    <div className="space-y-4">
      {toast && <p role="status" className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"><CheckCircle2 className="size-4" /> {toast}</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
            className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', filter === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            {f.label} ({counts.get(f.key) ?? 0})
          </button>
        ))}
      </div>
      <DataTable<ShopOrder>
        data={visible}
        columns={columns}
        rowKey={(o) => o.id}
        searchPlaceholder="Search order number, member or phone…"
        searchFilter={(o, q) => o.orderNumber.toLowerCase().includes(q) || o.buyerName.toLowerCase().includes(q) || o.buyerPhone.includes(q)}
        emptyMessage={filter === 'todo' ? 'Nothing to fulfil right now.' : 'No orders here.'}
      />

      <Modal open={!!open} onClose={() => { if (!busy) setOpen(null) }} title={open ? `Order ${open.orderNumber}` : ''} size="lg">
        {open && (
          <div className="space-y-4">
            {error && <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline" className={ORDER_STATUS[open.status].cls}>{ORDER_STATUS[open.status].label}</Badge>
              <span className="text-lg font-bold tabular-nums">{formatRwf(open.totalRwf)}</span>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {open.items.map((i, n) => (
                <li key={n} className="flex items-center gap-3 px-3 py-2">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted"><RemoteImage src={i.image} alt="" fill sizes="40px" className="object-cover" fallback={<div className="flex size-full items-center justify-center"><ShoppingBag className="size-4 text-muted-foreground" /></div>} /></div>
                  <span className="flex-1 text-sm">{i.title}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{i.quantity} × {formatRwf(i.unitPriceRwf)}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><p className="font-semibold">Member</p><p className="text-muted-foreground">{open.buyerName}<br />{open.buyerPhone}<br />{open.buyerEmail}</p></div>
              <div><p className="font-semibold">{open.deliveryMethod === 'DELIVERY' ? 'Deliver to' : 'Pickup'}</p><p className="whitespace-pre-line text-muted-foreground">{open.deliveryMethod === 'DELIVERY' ? open.deliveryAddress : 'At the Kingdom Library'}</p>{open.notes && <p className="mt-1 text-muted-foreground">Member note: {open.notes}</p>}</div>
            </div>

            {nextSteps(open).length > 0 && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                <Label htmlFor="staff-note">Note to the member <span className="font-normal text-muted-foreground">(optional, e.g. pickup hours or courier name)</span></Label>
                <Input id="staff-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
                <div className="flex flex-wrap justify-end gap-2">
                  {nextSteps(open).map((s) => (
                    <Button key={s} disabled={!!busy} onClick={() => act(open, { action: 'advance', status: s, note }, s)}>{busy === s && <Loader2 className="animate-spin" />} {STEP_LABEL[s]}</Button>
                  ))}
                </div>
              </div>
            )}
            {!['COMPLETED', 'CANCELLED', 'FAILED'].includes(open.status) && (
              <div className="flex justify-end">
                <Button variant="outline" className="text-destructive hover:text-destructive" disabled={!!busy}
                  onClick={() => { if (window.confirm(`Cancel order ${open.orderNumber}? Its products go back into stock.${open.status !== 'PENDING_PAYMENT' ? ' It was already paid — refund the member yourself.' : ''}`)) act(open, { action: 'cancel', reason: note || undefined }, 'cancel') }}>
                  {busy === 'cancel' && <Loader2 className="animate-spin" />} Cancel order
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
