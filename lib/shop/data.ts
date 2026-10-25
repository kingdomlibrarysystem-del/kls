import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'
import type { ShopCart, ShopCategory, ShopOrder, ShopProduct } from '@/lib/shop/shared'

/** MongoDB: a field never written is "unset", which `null` does not match — both mean "not in Trash". */
export const NOT_TRASHED = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] }

const PRODUCT_INCLUDE = { category: { select: { name: true } } } as const

type ProductRow = {
  id: string; title: string; description: string; priceRwf: number; compareAtPriceRwf: number | null; images: string[]
  categoryId: string; category: { name: string }; stockQty: number; status: string; soldCount: number; deletedAt: Date | null; createdAt: Date
}

export function serializeProduct(p: ProductRow): ShopProduct {
  return {
    id: p.id, title: p.title, description: p.description, priceRwf: p.priceRwf, compareAtPriceRwf: p.compareAtPriceRwf ?? null,
    images: p.images, categoryId: p.categoryId, categoryName: p.category.name, stockQty: p.stockQty,
    status: p.status as ShopProduct['status'], soldCount: p.soldCount, inTrash: !!p.deletedAt, createdAt: p.createdAt.toISOString(),
  }
}

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'popular'

/** Products members can buy (ACTIVE, not in Trash, active category), with filters. */
export async function listShopProducts(opts: { categoryId?: string; q?: string; sort?: ProductSort; limit?: number } = {}): Promise<ShopProduct[]> {
  const orderBy = opts.sort === 'price-asc' ? { priceRwf: 'asc' as const }
    : opts.sort === 'price-desc' ? { priceRwf: 'desc' as const }
      : opts.sort === 'popular' ? { soldCount: 'desc' as const }
        : { createdAt: 'desc' as const }
  const rows = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...NOT_TRASHED,
      category: { is: { active: true } },
      ...(opts.categoryId && isObjectId(opts.categoryId) && { categoryId: opts.categoryId }),
      ...(opts.q && { OR: [{ title: { contains: opts.q, mode: 'insensitive' as const } }, { description: { contains: opts.q, mode: 'insensitive' as const } }] }),
    },
    include: PRODUCT_INCLUDE,
    orderBy,
    take: Math.min(opts.limit ?? 200, 500),
  })
  return rows.map(serializeProduct)
}

/** One product a member may see (ACTIVE and not in Trash), or null. Staff pass `staff: true` to see any. */
export async function getShopProduct(id: string, staff = false): Promise<ShopProduct | null> {
  if (!isObjectId(id)) return null
  const row = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE })
  if (!row) return null
  if (!staff && (row.status !== 'ACTIVE' || row.deletedAt)) return null
  return serializeProduct(row)
}

/** Every product for the admin table (incl. drafts, archived and Trash). */
export async function listAllProducts(): Promise<ShopProduct[]> {
  const rows = await prisma.product.findMany({ include: PRODUCT_INCLUDE, orderBy: { createdAt: 'desc' } })
  return rows.map(serializeProduct)
}

export async function listCategories(opts: { activeOnly?: boolean; withCounts?: boolean } = {}): Promise<ShopCategory[]> {
  const [rows, counts] = await Promise.all([
    prisma.productCategory.findMany({ where: opts.activeOnly ? { active: true } : undefined, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    opts.withCounts ? prisma.product.groupBy({ by: ['categoryId'], where: NOT_TRASHED, _count: { _all: true } }) : Promise.resolve([] as { categoryId: string; _count: { _all: number } }[]),
  ])
  const countBy = new Map(counts.map((c) => [c.categoryId, c._count._all]))
  return rows.map((c) => ({
    id: c.id, name: c.name, description: c.description, sortOrder: c.sortOrder, active: c.active,
    ...(opts.withCounts && { productCount: countBy.get(c.id) ?? 0 }),
  }))
}

/** The member's cart with live prices/stock (prices are always re-read; a cart never keeps an old price). */
export async function getCart(userId: string): Promise<ShopCart> {
  const items = await prisma.productCartItem.findMany({
    where: { userId, product: { is: {} } },
    include: { product: { select: { title: true, images: true, priceRwf: true, stockQty: true, status: true, deletedAt: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const lines = items.map((i) => {
    const available = i.product.status === 'ACTIVE' && !i.product.deletedAt && i.product.stockQty > 0
    return {
      productId: i.productId,
      title: i.product.title,
      image: i.product.images[0] ?? null,
      unitPriceRwf: i.product.priceRwf,
      quantity: i.quantity,
      stockQty: i.product.stockQty,
      available,
    }
  })
  const buyable = lines.filter((l) => l.available)
  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalRwf: buyable.reduce((n, l) => n + l.unitPriceRwf * Math.min(l.quantity, l.stockQty), 0),
  }
}

type OrderRow = {
  id: string; orderNumber: string; userId: string; buyerName: string; buyerEmail: string; buyerPhone: string
  items: { productId: string; title: string; image: string | null; unitPriceRwf: number; quantity: number }[]
  subtotalRwf: number; deliveryFeeRwf: number; totalRwf: number; deliveryMethod: string; deliveryAddress: string | null
  notes: string | null; status: string; method: string; staffNote: string | null; paidAt: Date | null; createdAt: Date
}

export function serializeOrder(o: OrderRow): ShopOrder {
  return {
    id: o.id, orderNumber: o.orderNumber, userId: o.userId, buyerName: o.buyerName, buyerEmail: o.buyerEmail, buyerPhone: o.buyerPhone,
    items: o.items.map((i) => ({ productId: i.productId, title: i.title, image: i.image ?? null, unitPriceRwf: i.unitPriceRwf, quantity: i.quantity })),
    subtotalRwf: o.subtotalRwf, deliveryFeeRwf: o.deliveryFeeRwf, totalRwf: o.totalRwf,
    deliveryMethod: o.deliveryMethod as ShopOrder['deliveryMethod'], deliveryAddress: o.deliveryAddress, notes: o.notes,
    status: o.status as ShopOrder['status'], method: o.method as ShopOrder['method'], staffNote: o.staffNote,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null, createdAt: o.createdAt.toISOString(),
  }
}

export async function listOrders(where: { userId?: string; status?: string } = {}): Promise<ShopOrder[]> {
  const rows = await prisma.productOrder.findMany({
    where: { ...(where.userId && { userId: where.userId }), ...(where.status && { status: where.status as never }) },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })
  return rows.map(serializeOrder)
}

export async function getOrder(id: string): Promise<ShopOrder | null> {
  if (!isObjectId(id)) return null
  const row = await prisma.productOrder.findUnique({ where: { id } })
  return row ? serializeOrder(row) : null
}

/** Shop settings (delivery fee). */
export async function getShopSettings(): Promise<{ deliveryFeeRwf: number }> {
  const s = (await prisma.settings.findFirst()) ?? (await prisma.settings.create({ data: {} }))
  return { deliveryFeeRwf: s.shopDeliveryFeeRwf ?? 0 }
}

/** Numbers for the shop admin header. */
export async function getShopOverview() {
  const [products, lowStock, byStatus, revenue] = await Promise.all([
    prisma.product.count({ where: { status: 'ACTIVE', ...NOT_TRASHED } }),
    prisma.product.count({ where: { status: 'ACTIVE', ...NOT_TRASHED, stockQty: { lte: 3 } } }),
    prisma.productOrder.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.productOrder.aggregate({ where: { status: { in: ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'] } }, _sum: { totalRwf: true } }),
  ])
  const count = (...s: string[]) => byStatus.filter((b) => s.includes(b.status)).reduce((n, b) => n + b._count._all, 0)
  return {
    activeProducts: products,
    lowStock,
    toFulfil: count('PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'),
    awaitingPayment: count('PENDING_PAYMENT'),
    completed: count('COMPLETED'),
    revenueRwf: revenue._sum.totalRwf ?? 0,
  }
}
