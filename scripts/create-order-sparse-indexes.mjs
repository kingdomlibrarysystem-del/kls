/**
 * One-time (idempotent) setup: Prisma's MongoDB connector has no
 * schema-level way to express a *sparse* unique index — `@unique` alone
 * creates a plain unique index where every null/absent value collides
 * with every other one, which broke real Order creation (the second
 * Order ever created, with paypackRef still unset, would throw a 500;
 * confirmed by direct reproduction against the real database). This
 * script creates the real sparse unique indexes via Prisma's
 * $runCommandRaw (same raw-command mechanism already used elsewhere in
 * this codebase, e.g. the reservationQueueCounter null-backfill),
 * exempting null/absent values from the uniqueness check while still
 * enforcing it once a value IS set. Safe to re-run — createIndexes is
 * idempotent for an identical index definition.
 *
 * Run this once after any `npx prisma db push` that recreates the Order
 * collection or its indexes from scratch (db push does not know about
 * these indexes, since they aren't declared in schema.prisma — see
 * Order.paypackRef/stripeSessionId's docstrings there for why).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const result = await prisma.$runCommandRaw({
  createIndexes: 'Order',
  indexes: [
    { key: { paypackRef: 1 }, name: 'Order_paypackRef_sparse_unique', unique: true, sparse: true },
    { key: { stripeSessionId: 1 }, name: 'Order_stripeSessionId_sparse_unique', unique: true, sparse: true },
  ],
})

console.log(JSON.stringify(result, null, 2))
await prisma.$disconnect()
