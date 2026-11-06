'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { useLanguage } from '@/contexts/language-context'
import type { ShopProduct } from '@/lib/shop/shared'

interface Props {
  products: ShopProduct[]
  /** Shop categories linked to the service — "see all" links open the shop filtered to each. */
  categories: { id: string; name: string }[]
  /** /shop or /member/shop. */
  shopPath: string
}

/**
 * "Products for this service" on programme and sub-service pages: products
 * from the shop categories linked to the service and/or picked on its
 * sub-services, with links to the full category in the shop. Renders
 * nothing when the service has no products.
 */
export function ServiceProducts({ products, categories, shopPath }: Props) {
  const { t } = useLanguage()
  if (products.length === 0) return null
  return (
    <section id="products" aria-labelledby="service-products" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="service-products" className="flex items-center gap-2 font-cinzel text-lg font-bold uppercase text-foreground">
          <ShoppingBag className="size-5 text-primary" aria-hidden /> {t('services.products_title')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <Link key={c.id} href={`${shopPath}?category=${c.id}`} className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground transition-colors hover:border-primary hover:text-primary">
              {c.name}
            </Link>
          ))}
          <Link href={categories.length === 1 ? `${shopPath}?category=${categories[0].id}` : shopPath} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t('services.view_shop')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} basePath={shopPath} />)}
      </div>
    </section>
  )
}
