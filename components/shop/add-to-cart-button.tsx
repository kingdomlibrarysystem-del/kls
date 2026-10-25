'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Check, Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useShopCart } from '@/lib/client/use-shop-cart'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  productId: string
  quantity?: number
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default' | 'lg'
  /** After adding, go straight to the cart (the "Buy now" button). */
  goToCart?: boolean
  label?: string
}

/**
 * Add to cart. Guests are sent to sign in and brought back to this page.
 * Shows a spinner while saving and a short "Added" confirmation; the cart
 * badge updates at once (shared cart store).
 */
export function AddToCartButton({ productId, quantity = 1, disabled, className, size = 'default', goToCart, label }: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname() ?? '/shop'
  const { add } = useShopCart(isAuthenticated)
  const [state, setState] = useState<'idle' | 'busy' | 'added' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const onClick = async () => {
    if (!isAuthenticated) {
      // Come back to the member version of this page after signing in.
      const back = pathname.startsWith('/shop') ? `/member${pathname}` : pathname
      router.push(`/auth/login?redirect=${encodeURIComponent(back)}`)
      return
    }
    setState('busy')
    const result = await add(productId, quantity)
    setMessage(result.message)
    if (!result.ok) { setState('error'); setTimeout(() => setState('idle'), 3500); return }
    if (goToCart) { router.push('/member/shop/cart'); return }
    setState('added')
    setTimeout(() => setState('idle'), 1800)
  }

  return (
    <div className={cn('space-y-1', className)}>
      <Button type="button" size={size} disabled={disabled || state === 'busy'} onClick={onClick} className="w-full" aria-live="polite">
        {state === 'busy' ? <Loader2 className="animate-spin" /> : state === 'added' ? <Check /> : <ShoppingCart />}
        {disabled ? 'Sold out' : state === 'busy' ? 'Adding…' : state === 'added' ? 'Added' : label ?? 'Add to cart'}
      </Button>
      {state === 'error' && <p role="alert" className="text-xs text-destructive">{message}</p>}
    </div>
  )
}
