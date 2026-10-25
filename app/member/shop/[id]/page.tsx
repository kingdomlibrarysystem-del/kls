import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/shop/product-detail'
import { ShopHeader } from '@/components/shop/shop-header'
import { loadProductPage } from '@/lib/shop/pages'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await loadProductPage((await params).id)
  return data ? { title: data.product.title, description: data.product.description.slice(0, 160) } : {}
}

export default async function MemberProductPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await loadProductPage((await params).id)
  if (!data) notFound()
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <ShopHeader title="Beauty & Services Shop" showCart compact />
      <ProductDetail {...data} basePath="/member/shop" />
    </div>
  )
}
