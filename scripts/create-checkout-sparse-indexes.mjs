/**
 * One-time (idempotent) setup: same sparse-unique-index reasoning as
 * scripts/create-order-sparse-indexes.mjs — Prisma's MongoDB connector
 * has no schema-level way to express a sparse unique index, so
 * Checkout.paypackRef/stripeSessionId (both null on every newly created
 * Checkout, populated only once the real cashin/session call returns)
 * need a real sparse unique index created out-of-band via
 * $runCommandRaw. Safe to re-run.
 *
 * Run this once after any `npx prisma db push` that recreates the
 * Checkout collection or its indexes from scratch.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const result = await prisma.$runCommandRaw({
  createIndexes: 'Checkout',
  indexes: [
    { key: { paypackRef: 1 }, name: 'Checkout_paypackRef_sparse_unique', unique: true, sparse: true },
    { key: { stripeSessionId: 1 }, name: 'Checkout_stripeSessionId_sparse_unique', unique: true, sparse: true },
  ],
})

console.log(JSON.stringify(result, null, 2))
await prisma.$disconnect()
