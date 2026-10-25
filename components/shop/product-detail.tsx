'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import { discountPercent, formatRwf, MAX_QTY_PER_LINE, type ShopProduct } from '@/lib/shop/shared'
import { AddToCartButton } from './add-to-cart-button'
import { ProductCard } from './product-card'

/** Product page: photo gallery, price, stock, quantity, Add to cart / Buy now, description, and related products. */
export function ProductDetail({ product, related, basePath, deliveryFeeRwf }: { product: ShopProduct; related: ShopProduct[]; basePath: string; deliveryFeeRwf: number }) {
  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(1)
  const off = discountPercent(product)
  const soldOut = product.stockQty <= 0
  const maxQty = Math.min(product.stockQty, MAX_QTY_PER_LINE)

  return (
    <div className="space-y-8">
      <Link href={basePath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to the shop</Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <RemoteImage
              src={product.images[active]}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-12" /></div>}
            />
            {off && <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-sm font-bold text-white">-{off}%</span>}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product photos">
              {product.images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={cn('relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted', i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}
                >
                  <RemoteImage src={src} alt="" fill sizes="64px" className="object-cover" fallback={<div className="size-full" />} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{product.categoryName}</p>
            <h1 className="mt-1 font-cinzel text-2xl font-bold leading-tight text-foreground">{product.title}</h1>
            {product.soldCount > 0 && <p className="mt-1 text-xs text-muted-foreground">{product.soldCount.toLocaleString()} sold</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">{formatRwf(product.priceRwf)}</span>
            {off && <span className="text-base text-muted-foreground line-through">{formatRwf(product.compareAtPriceRwf!)}</span>}
          </div>

          <p className={cn('text-sm font-medium', soldOut ? 'text-destructive' : product.stockQty <= 5 ? 'text-warning' : 'text-success')}>
            {soldOut ? 'Sold out' : product.stockQty <= 5 ? `Only ${product.stockQty} left in stock` : 'In stock'}
          </p>

          {!soldOut && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <div className="flex items-center rounded-lg border border-border">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setQty((n) => Math.max(1, n - 1))} disabled={qty <= 1} aria-label="Less"><Minus /></Button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setQty((n) => Math.min(maxQty, n + 1))} disabled={qty >= maxQty} aria-label="More"><Plus /></Button>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <AddToCartButton productId={product.id} quantity={qty} disabled={soldOut} size="lg" />
            {!soldOut && <AddToCartButton productId={product.id} quantity={qty} size="lg" goToCart label="Buy now" />}
          </div>

          <ul className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Store className="size-4 shrink-0 text-primary" /> Free pickup at the Kingdom Library</li>
            <li className="flex items-center gap-2"><Truck className="size-4 shrink-0 text-primary" /> Delivery {deliveryFeeRwf > 0 ? `for ${formatRwf(deliveryFeeRwf)}` : 'available'}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 shrink-0 text-primary" /> Pay safely with mobile money (MTN / Airtel) or card</li>
          </ul>

          <div>
            <h2 className="mb-2 text-sm font-bold text-foreground">About this product</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 font-cinzel text-lg font-bold text-foreground">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} basePath={basePath} />)}
          </div>
        </section>
      )}
    </div>
  )
}
