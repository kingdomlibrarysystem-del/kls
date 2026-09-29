import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeAppointment(a: {
  id: string
  userId: string
  providerId: string
  serviceId: string
  dateTime: Date
  notes: string | null
  status: string
  provider?: { name: string }
  service?: { name: string; priceRwf: number }
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: a.id,
    userId: a.userId,
    providerId: a.providerId,
    providerName: a.provider?.name,
    serviceId: a.serviceId,
    serviceName: a.service?.name,
    priceRwf: a.service?.priceRwf,
    memberName: a.user ? (a.user.name ?? `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim()) : undefined,
    dateTime: a.dateTime.toISOString(),
    notes: a.notes,
    status: a.status,
  }
}

export const DETAIL_INCLUDE = { provider: { select: { name: true } }, service: { select: { name: true, priceRwf: true } }, user: { select: { name: true, firstName: true, lastName: true } } } as const

/** One record in the GET /api/beauty/appointments/[id] shape, plus its owner id for the owner-or-staff check. */
export async function getBeautyAppointmentDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.beautyAppointment.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  return row ? { ownerId: row.userId, data: serializeAppointment(row) } : null
}
