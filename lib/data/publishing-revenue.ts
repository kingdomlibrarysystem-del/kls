import prisma from '@/prisma/client'

/**
 * Money from books submitted by publishers.
 *  - The platform commission (%) is one admin setting
 *    (Settings.publishingCommissionPercent, default 30). The publisher earns
 *    the rest. Each book's RevenueShare stores the split it was approved with.
 *  - Every PAID order (sale or rental) of a published book adds its amount to
 *    that book's RevenueShare.totalRevenue — exactly once per order
 *    (Order.revenueCreditedAt), however many payment callbacks arrive.
 */

export const DEFAULT_COMMISSION_PERCENT = 30

async function settingsRow() {
  return (await prisma.settings.findFirst()) ?? prisma.settings.create({ data: {} })
}

/** The current platform commission, in percent (0–100). */
export async function getCommissionPercent(): Promise<number> {
  const s = await settingsRow()
  return s.publishingCommissionPercent ?? DEFAULT_COMMISSION_PERCENT
}

/**
 * Sets the platform commission. Books approved from now on use it. With
 * `applyToPublished`, every already-published book's split is changed too;
 * money already earned is not recalculated (the split only divides the total
 * when it is reported). Returns how many published books were updated.
 */
export async function setCommissionPercent(percent: number, applyToPublished: boolean): Promise<{ percent: number; updatedBooks: number }> {
  const s = await settingsRow()
  await prisma.settings.update({ where: { id: s.id }, data: { publishingCommissionPercent: percent } })
  let updatedBooks = 0
  if (applyToPublished) {
    const r = await prisma.revenueShare.updateMany({ data: { platformShare: percent, contributorShare: 100 - percent } })
    updatedBooks = r.count
  }
  return { percent, updatedBooks }
}

/**
 * Adds each newly-paid order's amount to the revenue of the publisher book it
 * belongs to (if any). Safe to call repeatedly with the same orders: an order
 * is claimed with an atomic "revenueCreditedAt is not set" update first, so it
 * is counted once. Orders for library books that no publisher submitted are
 * just marked as handled.
 */
export async function creditPaidOrdersToPublishers(orderIds: string[]): Promise<void> {
  for (const id of orderIds) {
    const claim = await prisma.order.updateMany({
      where: { id, status: 'PAID', OR: [{ revenueCreditedAt: null }, { revenueCreditedAt: { isSet: false } }] },
      data: { revenueCreditedAt: new Date() },
    })
    if (claim.count === 0) continue // not paid, or already credited
    const order = await prisma.order.findUnique({ where: { id }, select: { resourceId: true, amountRwf: true } })
    if (!order || order.amountRwf <= 0) continue
    const publication = await prisma.publication.findFirst({ where: { resourceId: order.resourceId, status: 'PUBLISHED' }, select: { id: true } })
    if (!publication) continue
    await prisma.revenueShare.updateMany({ where: { publicationId: publication.id }, data: { totalRevenue: { increment: order.amountRwf } } })
  }
}
