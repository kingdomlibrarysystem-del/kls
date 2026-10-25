import Link from 'next/link'
import { AlertTriangle, Clock, Package, PackageCheck, ShoppingBag, Wallet } from 'lucide-react'
import { formatRwf } from '@/lib/shop/shared'
import type { getShopOverview } from '@/lib/shop/data'

type Overview = Awaited<ReturnType<typeof getShopOverview>>

/** Live shop numbers for the admin pages (aggregated on the server). */
export function ShopStats({ overview }: { overview: Overview }) {
  const items = [
    { label: 'Products for sale', value: overview.activeProducts.toLocaleString(), icon: <ShoppingBag />, href: '/dashboard/beauty/shop/products', tone: 'bg-primary/10 text-primary' },
    { label: 'Low stock (≤ 3)', value: overview.lowStock.toLocaleString(), icon: <AlertTriangle />, href: '/dashboard/beauty/shop/products', tone: overview.lowStock > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground' },
    { label: 'Orders to fulfil', value: overview.toFulfil.toLocaleString(), icon: <Package />, href: '/dashboard/beauty/shop/orders', tone: overview.toFulfil > 0 ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground' },
    { label: 'Awaiting payment', value: overview.awaitingPayment.toLocaleString(), icon: <Clock />, href: '/dashboard/beauty/shop/orders', tone: 'bg-muted text-muted-foreground' },
    { label: 'Completed orders', value: overview.completed.toLocaleString(), icon: <PackageCheck />, href: '/dashboard/beauty/shop/orders', tone: 'bg-success/10 text-success' },
    { label: 'Sales (paid)', value: formatRwf(overview.revenueRwf), icon: <Wallet />, href: '/dashboard/beauty/shop/orders', tone: 'bg-success/10 text-success' },
  ]
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((s) => (
        <Link key={s.label} href={s.href} className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs transition-colors hover:border-primary/40">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <span className={`flex size-7 items-center justify-center rounded-lg [&_svg]:size-3.5 ${s.tone}`}>{s.icon}</span>
          </div>
          <p suppressHydrationWarning className="mt-2 font-cinzel text-lg font-bold leading-none text-foreground">{s.value}</p>
        </Link>
      ))}
    </div>
  )
}
