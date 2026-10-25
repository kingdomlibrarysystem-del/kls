import type { Metadata } from 'next'
import { ShopBrowser } from '@/components/shop/shop-browser'
import { ShopHeader } from '@/components/shop/shop-header'
import { loadShopHome } from '@/lib/shop/pages'

export const metadata: Metadata = { title: 'Shop', description: 'Beauty & Services products from the Kingdom Library — pay with mobile money or card, pickup or delivery.' }

/** Public shop: guests browse everything; "Add to cart" asks them to sign in and brings them back. */
export default async function PublicShopPage() {
  const { products, categories } = await loadShopHome()
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <ShopHeader title="Beauty & Services Shop" subtitle="Quality products, delivered or ready for pickup" />
      <ShopBrowser products={products} categories={categories} basePath="/shop" />
    </div>
  )
}
