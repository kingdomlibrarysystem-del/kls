'use client'

import Link from 'next/link'
import { Package, ShoppingCart } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useShopCart } from '@/lib/client/use-shop-cart'
import { cn } from '@/lib/utils'

/** Shop page heading with "My orders" and a cart button showing the live item count. */
export function ShopHeader({ title, subtitle, showCart, compact }: { title: string; subtitle?: string; showCart?: boolean; compact?: boolean }) {
  const { isAuthenticated } = useAuth()
  const { cart } = useShopCart(isAuthenticated)
  const linksVisible = showCart || isAuthenticated

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className={cn('font-cinzel font-bold text-foreground', compact ? 'text-lg' : 'text-2xl')}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {linksVisible && (
        <div className="flex items-center gap-2">
          <Link href="/member/shop/orders" className={buttonVariants({ variant: 'outline', size: 'sm' })}><Package /> My orders</Link>
          <Link href="/member/shop/cart" className={cn(buttonVariants({ size: 'sm' }), 'relative')} aria-label={`Cart, ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}`}>
            <ShoppingCart /> Cart
            {cart.itemCount > 0 && (
              <span className="ml-1 rounded-full bg-primary-foreground px-1.5 text-xs font-bold tabular-nums text-primary">{cart.itemCount}</span>
            )}
          </Link>
        </div>
      )}
    </div>
  )
}
