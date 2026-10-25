import Link from 'next/link'
import { AlertTriangle, CalendarCheck, ExternalLink, Package, Palette, Plus, Scissors, ShoppingBag, Star, Tag } from 'lucide-react'
import prisma from '@/prisma/client'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { buttonVariants } from '@/components/ui/button'
import { LocalDate } from '@/components/ui/local-date'
import { pageHasPermission, requireStaffPage } from '@/lib/server/page-session'
import { getShopOverview, NOT_TRASHED } from '@/lib/shop/data'
import { formatRwf, ORDER_STATUS, SHOP_PERMISSION, type OrderStatus } from '@/lib/shop/shared'
import { ShopStats } from './shop/_components/shop-stats'

const LINKS = [
  { icon: ShoppingBag, title: 'Products', desc: 'Add, price and stock the products members buy.', href: '/dashboard/beauty/shop/products', shop: true },
  { icon: Tag, title: 'Categories', desc: 'Group products (skin care, hair care, wellness…).', href: '/dashboard/beauty/shop/categories', shop: true },
  { icon: Package, title: 'Orders', desc: 'Confirm, prepare and hand over paid orders.', href: '/dashboard/beauty/shop/orders', shop: true },
  { icon: CalendarCheck, title: 'Appointments', desc: 'Sessions booked with beauty service providers.', href: '/dashboard/beauty/appointments', shop: false },
  { icon: Scissors, title: 'Service catalog', desc: 'Haircare, skincare and grooming services.', href: '/dashboard/beauty/services', shop: false },
  { icon: Palette, title: 'Providers', desc: 'Stylists and therapists with their specialties.', href: '/dashboard/beauty/providers', shop: false },
  { icon: Star, title: 'Reviews', desc: 'What members say about completed sessions.', href: '/dashboard/beauty/reviews', shop: false },
]

/**
 * Beauty & Shop overview — server-loaded: live shop numbers, the orders that
 * need someone now, products about to sell out, and every management page.
 * Staff without "Manage Shop" see only the appointment-side links.
 */
export default async function BeautyOverviewPage() {
  await requireStaffPage()
  const canShop = await pageHasPermission(SHOP_PERMISSION)

  const [overview, needsAction, lowStock] = canShop
    ? await Promise.all([
        getShopOverview(),
        prisma.productOrder.findMany({
          where: { status: { in: ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] } },
          orderBy: { createdAt: 'asc' }, take: 6,
          select: { id: true, orderNumber: true, buyerName: true, totalRwf: true, status: true, deliveryMethod: true, createdAt: true },
        }),
        prisma.product.findMany({
          where: { status: 'ACTIVE', ...NOT_TRASHED, stockQty: { lte: 3 } },
          orderBy: { stockQty: 'asc' }, take: 6,
          select: { id: true, title: true, stockQty: true },
        }),
      ])
    : [null, [], []]

  return (
    <PageTransition>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <PageHeader className="mb-0" title="Beauty & Shop" subtitle="Products members buy online, plus beauty appointments" />
        <div className="flex flex-wrap gap-2">
          <Link href="/shop" target="_blank" className={buttonVariants({ variant: 'outline' })}><ExternalLink /> View shop</Link>
          {canShop && <Link href="/dashboard/beauty/shop/products?new=1" className={buttonVariants()}><Plus /> Add product</Link>}
        </div>
      </div>

      {overview && <ShopStats overview={overview} />}

      {canShop && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">Orders to handle</h2>
              <Link href="/dashboard/beauty/shop/orders" className="text-sm text-primary hover:underline">All orders</Link>
            </div>
            {needsAction.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing waiting — every paid order is handled.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {needsAction.map((o) => (
                  <li key={o.id}>
                    <Link href={`/dashboard/beauty/shop/orders?order=${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm hover:bg-muted/40">
                      <span className="font-mono text-xs text-muted-foreground">{o.orderNumber}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{o.buyerName}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${ORDER_STATUS[o.status as OrderStatus]?.cls ?? ''}`}>{ORDER_STATUS[o.status as OrderStatus]?.label ?? o.status}</span>
                      <span className="tabular-nums text-foreground">{formatRwf(o.totalRwf)}</span>
                      <span className="w-full text-xs text-muted-foreground sm:w-auto">{o.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'} · <LocalDate value={o.createdAt} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><AlertTriangle className="size-4 text-warning" /> Running low</h2>
              <Link href="/dashboard/beauty/shop/products" className="text-sm text-primary hover:underline">All products</Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Every product has more than 3 in stock.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate text-foreground">{p.title}</span>
                    <span className={`shrink-0 font-semibold ${p.stockQty === 0 ? 'text-destructive' : 'text-warning'}`}>{p.stockQty === 0 ? 'Sold out' : `${p.stockQty} left`}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.filter((l) => canShop || !l.shop).map(({ icon: Icon, title, desc, href }) => (
          <Link key={href} href={href} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/40">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
            <span>
              <span className="block font-semibold text-foreground">{title}</span>
              <span className="block text-sm text-muted-foreground">{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </PageTransition>
  )
}
