/**
 * One-time (idempotent) setup, parallel to
 * create-order-sparse-indexes.mjs — CourseOrder.paypackRef/stripeSessionId
 * have exactly the same "not @unique in schema.prisma, real sparse unique
 * index created out-of-band" reasoning as Order's own fields (see
 * CourseOrder's docstring in prisma/schema.prisma). Safe to re-run after
 * any `npx prisma db push` touching this model.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const result = await prisma.$runCommandRaw({
  createIndexes: 'CourseOrder',
  indexes: [
    { key: { paypackRef: 1 }, name: 'CourseOrder_paypackRef_sparse_unique', unique: true, sparse: true },
    { key: { stripeSessionId: 1 }, name: 'CourseOrder_stripeSessionId_sparse_unique', unique: true, sparse: true },
  ],
})

console.log(JSON.stringify(result, null, 2))
await prisma.$disconnect()
