import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { discountPercent, formatRwf, type ShopProduct } from '@/lib/shop/shared'
import { AddToCartButton } from './add-to-cart-button'

/** One product in the shop grid: photo, category, name, price (with "was" price and discount), stock state, Add to cart. */
export function ProductCard({ product, basePath }: { product: ShopProduct; basePath: string }) {
  const off = discountPercent(product)
  const soldOut = product.stockQty <= 0
  const href = `${basePath}/${product.id}`
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-muted" aria-label={product.title}>
        <RemoteImage
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-8" /></div>}
        />
        {off && <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>}
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-semibold text-white">Sold out</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{product.categoryName}</p>
        <Link href={href} className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary">{product.title}</Link>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-bold text-foreground">{formatRwf(product.priceRwf)}</span>
          {off && <span className="text-xs text-muted-foreground line-through">{formatRwf(product.compareAtPriceRwf!)}</span>}
        </div>
        {!soldOut && product.stockQty <= 5 && <p className="text-xs font-medium text-warning">Only {product.stockQty} left</p>}
        <AddToCartButton productId={product.id} disabled={soldOut} className="mt-2 w-full" size="sm" />
      </div>
    </article>
  )
}
