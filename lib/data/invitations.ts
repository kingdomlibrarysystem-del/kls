import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

/** Single invitation with its role — shared by GET /api/invitations/[id] and the server-rendered detail page. */
export async function getInvitationById(id: string) {
  if (!isObjectId(id)) return null
  return prisma.invitation.findUnique({
    where: { id },
    include: { role: { select: { id: true, name: true } } },
  })
}
