import { z } from 'zod'
import { MAX_QTY_PER_LINE } from '@/lib/shop/shared'

const imageUrl = z.string().trim().url('An image link is not valid — upload it again')

export const productSchema = z.object({
  title: z.string().trim().min(2, 'Give the product a name').max(160),
  description: z.string().trim().min(10, 'Describe the product (at least 10 characters)').max(5000),
  priceRwf: z.number().int('Price must be a whole number of RWF').min(100, 'Minimum price is 100 RWF').max(100_000_000),
  compareAtPriceRwf: z.number().int().min(0).max(100_000_000).nullable().optional(),
  images: z.array(imageUrl).min(1, 'Add at least one photo').max(8, 'At most 8 photos'),
  categoryId: z.string().trim().min(1, 'Choose a category'),
  stockQty: z.number().int().min(0, 'Stock cannot be negative').max(1_000_000),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
})

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is too short').max(60),
  description: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
})

export const cartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(MAX_QTY_PER_LINE),
  /** add = increase by quantity (Add to cart); set = make it exactly quantity (cart page stepper). */
  mode: z.enum(['add', 'set']).default('add'),
})

export const placeOrderSchema = z.object({
  buyerName: z.string().trim().min(2, 'Enter your name').max(120),
  buyerPhone: z.string().trim().max(20).default(''),
  deliveryMethod: z.enum(['PICKUP', 'DELIVERY']),
  deliveryAddress: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  method: z.enum(['PAYPACK', 'STRIPE', 'INTOUCH', 'MTN_MOMO', 'PESAPAL', 'URUBUTOPAY']),
  productIds: z.array(z.string()).max(200).optional(),
})

export const orderActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('cancel'), reason: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal('retry') }),
  z.object({ action: z.literal('check') }),
  z.object({ action: z.literal('advance'), status: z.enum(['PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED']), note: z.string().trim().max(500).optional() }),
])
