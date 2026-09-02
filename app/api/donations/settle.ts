import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { orderPaidEmailHtml, orderFailedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

interface SettleInput {
  paypackStatus?: string
  paypackProvider?: string
  providerStatus: string
}

/**
 * Real settlement path, mirrors settleOrder (app/api/orders/settle.ts)
 * exactly, but on success this atomically increments
 * DonationCampaign.raisedRwf instead of creating a Borrow/Reservation
 * — same "denormalized counter, recomputed at the one real write
 * path" convention as Resource.availableQty/reservationQueueCounter.
 * Only increments when campaignId is set (a sponsorship donation has
 * no running total to update). Idempotent: only increments once per
 * donation, since a donation's own status flips PENDING -> PAID
 * exactly once and this function is a no-op on an already-PAID row.
 */
export async function settleDonation(donationId: string, input: SettleInput) {
  const donation = await prisma.donation.findUnique({ where: { id: donationId } })
  if (!donation) throw new Error('Donation not found')

  const isSuccessful = input.providerStatus === 'successful'
  const isFailed = input.providerStatus === 'failed'
  const alreadySettled = donation.status === 'PAID'

  const updated = await prisma.donation.update({
    where: { id: donationId },
    data: {
      ...(input.paypackStatus && { paypackStatus: input.paypackStatus }),
      ...(input.paypackProvider && { paypackProvider: input.paypackProvider }),
      ...(isSuccessful && { status: 'PAID', paidAt: new Date() }),
      ...(isFailed && { status: 'FAILED' }),
    },
  })

  if (isSuccessful && !alreadySettled) {
    if (donation.campaignId) {
      await prisma.donationCampaign.update({ where: { id: donation.campaignId }, data: { raisedRwf: { increment: donation.amountRwf } } })
    }

    const destinationUrl = `${appBaseUrl()}/dashboard/donations/history/${donation.id}`
    await notifyUser({
      userId: donation.userId,
      type: 'SYSTEM',
      category: 'order-payment-success',
      title: 'Donation confirmed',
      message: `Your donation of ${donation.amountRwf.toLocaleString()} RWF was successful — thank you.`,
      href: destinationUrl,
      email: { subject: 'Your donation is confirmed', html: orderPaidEmailHtml(donation.donorName, 'your donation', donation.amountRwf, destinationUrl) },
    })
  } else if (isFailed && donation.status !== 'FAILED') {
    const donationUrl = `${appBaseUrl()}/dashboard/donations/history/${donation.id}`
    await notifyUser({
      userId: donation.userId,
      type: 'SYSTEM',
      category: 'order-payment-failed',
      title: 'Donation payment failed',
      message: 'Your donation payment could not be completed.',
      href: donationUrl,
      email: { subject: 'Your donation payment failed', html: orderFailedEmailHtml(donation.donorName, 'your donation', donationUrl) },
    })
  }

  return updated
}
