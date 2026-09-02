/**
 * One-time (idempotent) setup: same reasoning as
 * create-order-sparse-indexes.mjs — Prisma's MongoDB connector has no
 * schema-level way to express a sparse unique index, and Donation.
 * paypackRef/stripeSessionId are null for every PENDING donation before
 * a payment attempt starts, so a plain @unique would collide on the
 * second such row. Run once after any `npx prisma db push` that
 * recreates the Donation collection or its indexes from scratch.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const result = await prisma.$runCommandRaw({
  createIndexes: 'Donation',
  indexes: [
    { key: { paypackRef: 1 }, name: 'Donation_paypackRef_sparse_unique', unique: true, sparse: true },
    { key: { stripeSessionId: 1 }, name: 'Donation_stripeSessionId_sparse_unique', unique: true, sparse: true },
  ],
})

console.log(JSON.stringify(result, null, 2))
await prisma.$disconnect()
