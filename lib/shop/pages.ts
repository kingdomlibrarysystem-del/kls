import { cache } from 'react'
import { getShopProduct, getShopSettings, listCategories, listShopProducts } from '@/lib/shop/data'
import { toPlain } from '@/lib/server/to-plain'
import type { ShopCategory, ShopProduct } from '@/lib/shop/shared'

/** Everything the shop grid needs, for the member and public shop pages (two parallel queries). */
export async function loadShopHome(): Promise<{ products: ShopProduct[]; categories: ShopCategory[] }> {
  const [products, categories] = await Promise.all([listShopProducts({ limit: 500 }), listCategories({ activeOnly: true })])
  return { products: toPlain<ShopProduct[]>(products), categories: toPlain<ShopCategory[]>(categories) }
}

/** A product page: the product, up to 4 others from its category, and the delivery fee. cache()d for generateMetadata. */
export const loadProductPage = cache(async (id: string) => {
  const product = await getShopProduct(id)
  if (!product) return null
  const [sameCategory, settings] = await Promise.all([listShopProducts({ categoryId: product.categoryId, limit: 8 }), getShopSettings()])
  return {
    product: toPlain<ShopProduct>(product),
    related: toPlain<ShopProduct[]>(sameCategory.filter((p) => p.id !== product.id).slice(0, 4)),
    deliveryFeeRwf: settings.deliveryFeeRwf,
  }
})
