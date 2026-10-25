'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CreditCard, Loader2, Lock, Minus, Plus, ShoppingBag, Smartphone, Store, Trash2, Truck } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RemoteImage } from '@/components/ui/remote-image'
import { useShopCart } from '@/lib/client/use-shop-cart'
import { formatRwf, MAX_QTY_PER_LINE, type ShopCart } from '@/lib/shop/shared'
import { cn } from '@/lib/utils'

interface Props {
  initialCart: ShopCart
  deliveryFeeRwf: number
  defaultName: string
  defaultPhone: string
  cardAvailable: boolean
}

/**
 * Cart on the left, checkout on the right (stacked on phones). Quantities
 * save as you change them; anything sold out or withdrawn is flagged and left
 * out of the total. "Place order" stays busy until the payment step opens:
 * the order page (mobile money prompt sent) or the card page.
 */
export function CartCheckoutView({ initialCart, deliveryFeeRwf, defaultName, defaultPhone, cardAvailable }: Props) {
  const router = useRouter()
  const { cart: liveCart, loading, setQuantity, remove, replace } = useShopCart(true)
  // The server-rendered cart shows immediately; the shared store takes over once loaded.
  useEffect(() => { if (loading) replace(initialCart) }, [loading, initialCart, replace])
  const cart = loading ? initialCart : liveCart

  const [busyLine, setBusyLine] = useState<string | null>(null)
  const [lineError, setLineError] = useState('')
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  const [delivery, setDelivery] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [method, setMethod] = useState<'PAYPACK' | 'STRIPE'>('PAYPACK')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const buyable = cart.lines.filter((l) => l.available)
  const unavailable = cart.lines.filter((l) => !l.available)
  const fee = delivery === 'DELIVERY' ? deliveryFeeRwf : 0
  const total = cart.subtotalRwf + fee

  const changeQty = async (productId: string, qty: number) => {
    setBusyLine(productId)
    setLineError('')
    const r = qty <= 0 ? await remove(productId) : await setQuantity(productId, qty)
    if (!r.ok || r.message.startsWith('Only')) setLineError(r.message)
    setBusyLine(null)
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) { setError('Enter your name'); return }
    if (method === 'PAYPACK' && !/^(\+?25)?(078|079|075|073|072)\d{7}$/.test(phone.replace(/\s/g, ''))) { setError('Enter your MTN or Airtel number, e.g. 078 123 4567'); return }
    if (delivery === 'DELIVERY' && address.trim().length < 5) { setError('Enter the delivery address'); return }
    setPlacing(true)
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerName: name.trim(), buyerPhone: phone.replace(/\s/g, ''), deliveryMethod: delivery, deliveryAddress: address, notes, method }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not place the order')
      replace({ lines: unavailable, itemCount: unavailable.reduce((n, l) => n + l.quantity, 0), subtotalRwf: 0 })
      // Stay busy until the next page opens.
      if (json.data.checkoutUrl) window.location.href = json.data.checkoutUrl
      else router.push(`/member/shop/orders/${json.data.orderId}?placed=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order')
      setPlacing(false)
    }
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" />
        <p className="font-semibold text-foreground">Your cart is empty</p>
        <Link href="/member/shop" className={buttonVariants()}>Browse the shop</Link>
      </div>
    )
  }

  const option = (active: boolean) => cn('flex flex-1 cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors', active ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Cart lines */}
      <section className="space-y-3" aria-label="Items in your cart">
        {lineError && (
          <p role="alert" className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground"><AlertCircle className="size-4 text-warning" /> {lineError}</p>
        )}
        {cart.lines.map((l) => (
          <div key={l.productId} className={cn('flex gap-3 rounded-xl border border-border bg-card p-3 shadow-xs', !l.available && 'opacity-70')}>
            <Link href={`/member/shop/${l.productId}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
              <RemoteImage src={l.image} alt={l.title} fill sizes="96px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-6" /></div>} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link href={`/member/shop/${l.productId}`} className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary">{l.title}</Link>
              <p className="text-sm text-muted-foreground">{formatRwf(l.unitPriceRwf)}</p>
              {!l.available ? (
                <p className="text-xs font-medium text-destructive">No longer available — remove it to continue</p>
              ) : l.quantity > l.stockQty ? (
                <p className="text-xs font-medium text-warning">Only {l.stockQty} left</p>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                {l.available ? (
                  <div className="flex items-center rounded-lg border border-border">
                    <Button type="button" variant="ghost" size="icon-sm" disabled={busyLine === l.productId || l.quantity <= 1} onClick={() => changeQty(l.productId, l.quantity - 1)} aria-label={`Fewer ${l.title}`}><Minus /></Button>
                    <span className="w-9 text-center text-sm font-semibold tabular-nums">{busyLine === l.productId ? <Loader2 className="mx-auto size-4 animate-spin" /> : l.quantity}</span>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={busyLine === l.productId || l.quantity >= Math.min(l.stockQty, MAX_QTY_PER_LINE)} onClick={() => changeQty(l.productId, l.quantity + 1)} aria-label={`More ${l.title}`}><Plus /></Button>
                  </div>
                ) : <span />}
                <div className="flex items-center gap-3">
                  {l.available && <span className="text-sm font-bold tabular-nums text-foreground">{formatRwf(l.unitPriceRwf * Math.min(l.quantity, l.stockQty))}</span>}
                  <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busyLine === l.productId} onClick={() => changeQty(l.productId, 0)} aria-label={`Remove ${l.title}`}><Trash2 /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <Link href="/member/shop" className="inline-block text-sm text-primary hover:underline">← Continue shopping</Link>
      </section>

      {/* Checkout */}
      <form onSubmit={placeOrder} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs lg:sticky lg:top-4">
        <h2 className="text-base font-bold text-foreground">Checkout</h2>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">How do you want to get it?</legend>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <label className={option(delivery === 'PICKUP')}>
              <input type="radio" name="delivery" className="sr-only" checked={delivery === 'PICKUP'} onChange={() => setDelivery('PICKUP')} />
              <Store className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block font-medium">Pickup</span><span className="text-xs text-muted-foreground">Free — we tell you when it&apos;s ready</span></span>
            </label>
            <label className={option(delivery === 'DELIVERY')}>
              <input type="radio" name="delivery" className="sr-only" checked={delivery === 'DELIVERY'} onChange={() => setDelivery('DELIVERY')} />
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block font-medium">Delivery</span><span className="text-xs text-muted-foreground">{deliveryFeeRwf > 0 ? formatRwf(deliveryFeeRwf) : 'Free'}</span></span>
            </label>
          </div>
        </fieldset>

        {delivery === 'DELIVERY' && (
          <div className="space-y-1.5">
            <Label htmlFor="ship-address">Delivery address</Label>
            <Textarea id="ship-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={500} placeholder="District, sector, street / landmark" />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="buyer-name">Your name</Label>
            <Input id="buyer-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buyer-phone">Phone {method === 'PAYPACK' && <span className="font-normal text-muted-foreground">(pays the order)</span>}</Label>
            <Input id="buyer-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="078 123 4567" autoComplete="tel" />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Payment</legend>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <label className={option(method === 'PAYPACK')}>
              <input type="radio" name="method" className="sr-only" checked={method === 'PAYPACK'} onChange={() => setMethod('PAYPACK')} />
              <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block font-medium">Mobile money</span><span className="text-xs text-muted-foreground">MTN MoMo / Airtel Money</span></span>
            </label>
            {cardAvailable && (
              <label className={option(method === 'STRIPE')}>
                <input type="radio" name="method" className="sr-only" checked={method === 'STRIPE'} onChange={() => setMethod('STRIPE')} />
                <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block font-medium">Card</span><span className="text-xs text-muted-foreground">Visa / Mastercard</span></span>
              </label>
            )}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="order-notes">Note <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="order-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="e.g. colour, best time to call" />
        </div>

        <dl className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Items ({buyable.reduce((n, l) => n + Math.min(l.quantity, l.stockQty), 0)})</dt><dd className="tabular-nums">{formatRwf(cart.subtotalRwf)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{fee > 0 ? formatRwf(fee) : 'Free'}</dd></div>
          <div className="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatRwf(total)}</dd></div>
        </dl>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" /> {error}</p>
        )}
        {unavailable.length > 0 && <p className="text-xs text-warning">Items that are no longer available are not included.</p>}

        <Button type="submit" size="lg" className="w-full" disabled={placing || buyable.length === 0} aria-busy={placing}>
          {placing ? <Loader2 className="animate-spin" /> : <Lock />}
          {placing ? (method === 'PAYPACK' ? 'Sending payment request…' : 'Opening card payment…') : `Place order · ${formatRwf(total)}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {method === 'PAYPACK' ? 'You will get a prompt on your phone to approve the payment.' : 'You will pay on a secure card page.'}
        </p>
      </form>
    </div>
  )
}
