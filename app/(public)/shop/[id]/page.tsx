import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/shop/product-detail'
import { loadProductPage } from '@/lib/shop/pages'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await loadProductPage((await params).id)
  return data ? { title: data.product.title, description: data.product.description.slice(0, 160) } : {}
}

export default async function PublicProductPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await loadProductPage((await params).id)
  if (!data) notFound()
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ProductDetail {...data} basePath="/shop" />
    </div>
  )
}
