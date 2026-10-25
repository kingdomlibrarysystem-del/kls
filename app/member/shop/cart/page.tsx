import prisma from '@/prisma/client'
import { requirePageAuth } from '@/lib/server/page-session'
import { getCart, getShopSettings } from '@/lib/shop/data'
import { isStripeConfigured } from '@/lib/stripe'
import { toPlain } from '@/lib/server/to-plain'
import type { ShopCart } from '@/lib/shop/shared'
import { ShopHeader } from '@/components/shop/shop-header'
import { CartCheckoutView } from './_components/cart-checkout-view'

/** Cart + checkout in one page. Cart, delivery fee and the member's saved name/phone are loaded on the server. */
export default async function ShopCartPage() {
  const session = await requirePageAuth()
  const [cart, settings, user] = await Promise.all([
    getCart(session.userId),
    getShopSettings(),
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, firstName: true, lastName: true, phonenumber: true } }),
  ])
  const name = (user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || ''
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <ShopHeader title="Your cart" compact showCart />
      <CartCheckoutView
        initialCart={toPlain<ShopCart>(cart)}
        deliveryFeeRwf={settings.deliveryFeeRwf}
        defaultName={name}
        defaultPhone={user?.phonenumber ?? ''}
        cardAvailable={isStripeConfigured()}
      />
    </div>
  )
}
