'use client'

import { useMemo, useState } from 'react'
import { Search, ShoppingBag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ShopCategory, ShopProduct } from '@/lib/shop/shared'
import { ProductCard } from './product-card'

type Sort = 'newest' | 'price-asc' | 'price-desc' | 'popular'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Best sellers' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

/**
 * The shop grid. Every product for sale arrives from the server page, so
 * searching, choosing a category and sorting happen instantly in the browser
 * with no loading between clicks.
 */
export function ShopBrowser({ products, categories, basePath }: { products: ShopProduct[]; categories: ShopCategory[]; basePath: string }) {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('newest')

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = products.filter((p) =>
      (category === 'all' || p.categoryId === category) &&
      (!needle || p.title.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle) || p.categoryName.toLowerCase().includes(needle)))
    const sorted = [...list]
    if (sort === 'price-asc') sorted.sort((a, b) => a.priceRwf - b.priceRwf)
    else if (sort === 'price-desc') sorted.sort((a, b) => b.priceRwf - a.priceRwf)
    else if (sort === 'popular') sorted.sort((a, b) => b.soldCount - a.soldCount)
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    // In-stock first, so sold-out items never push buyable ones down.
    return sorted.sort((a, b) => Number(b.stockQty > 0) - Number(a.stockQty > 0))
  }, [products, q, category, sort])

  const counts = useMemo(() => new Map(categories.map((c) => [c.id, products.filter((p) => p.categoryId === c.id).length])), [categories, products])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" />
        <p className="font-semibold text-foreground">The shop is opening soon</p>
        <p className="max-w-sm text-sm text-muted-foreground">No products are on sale yet. Please check back shortly.</p>
      </div>
    )
  }

  const chip = (id: string, label: string, n: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setCategory(id)}
      aria-pressed={category === id}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        category === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      {label} <span className="opacity-70">({n})</span>
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-10 pl-9" aria-label="Search products" />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort products"
          className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Categories">
        {chip('all', 'All', products.length)}
        {categories.filter((c) => (counts.get(c.id) ?? 0) > 0).map((c) => chip(c.id, c.name, counts.get(c.id) ?? 0))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => <ProductCard key={p.id} product={p} basePath={basePath} />)}
        </div>
      )}
    </div>
  )
}
