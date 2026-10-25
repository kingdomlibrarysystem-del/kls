import Link from 'next/link'
import { Package, ShoppingBag } from 'lucide-react'
import { requirePageAuth } from '@/lib/server/page-session'
import { listOrders } from '@/lib/shop/data'
import { ORDER_STATUS, formatRwf } from '@/lib/shop/shared'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LocalDate } from '@/components/ui/local-date'
import { RemoteImage } from '@/components/ui/remote-image'
import { ShopHeader } from '@/components/shop/shop-header'

/** The member's shop orders, newest first (server-loaded). */
export default async function MyShopOrdersPage() {
  const session = await requirePageAuth()
  const orders = await listOrders({ userId: session.userId })
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <ShopHeader title="My orders" compact showCart />
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No orders yet</p>
          <Link href="/member/shop" className={buttonVariants()}>Browse the shop</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const s = ORDER_STATUS[o.status]
            const count = o.items.reduce((n, i) => n + i.quantity, 0)
            return (
              <li key={o.id}>
                <Link href={`/member/shop/orders/${o.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/50">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((i, n) => (
                      <div key={n} className="relative size-12 overflow-hidden rounded-lg border-2 border-card bg-muted">
                        <RemoteImage src={i.image} alt="" fill sizes="48px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-4" /></div>} />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{o.items.length === 1 ? o.items[0].title : `${o.items[0].title} + ${o.items.length - 1} more`}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.orderNumber} · <LocalDate value={o.createdAt} options={{ dateStyle: 'medium' }} /> · {count} item{count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold tabular-nums text-foreground">{formatRwf(o.totalRwf)}</span>
                    <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
