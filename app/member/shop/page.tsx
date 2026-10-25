import { ShopBrowser } from '@/components/shop/shop-browser'
import { ShopHeader } from '@/components/shop/shop-header'
import { loadShopHome } from '@/lib/shop/pages'

/** Member shop: every product for sale, loaded on the server; filtering happens instantly in the browser. */
export default async function MemberShopPage() {
  const { products, categories } = await loadShopHome()
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <ShopHeader title="Beauty & Services Shop" subtitle="Quality products, delivered or ready for pickup" showCart />
      <ShopBrowser products={products} categories={categories} basePath="/member/shop" />
    </div>
  )
}
