import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/** Real CounselingConsent API — one row per member, upserted, same single-row-per-owner convention as Settings/Cart. */
function serializeConsent(c: { userId: string; shareNotesWithMember: boolean; allowStaffContact: boolean; emergencyContactName: string | null; emergencyContactPhone: string | null }) {
  return {
    userId: c.userId,
    shareNotesWithMember: c.shareNotesWithMember,
    allowStaffContact: c.allowStaffContact,
    emergencyContactName: c.emergencyContactName,
    emergencyContactPhone: c.emergencyContactPhone,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const consent = await prisma.counselingConsent.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })

  return NextResponse.json({ data: serializeConsent(consent), message: 'Consent fetched successfully', code: 'success', status: 200 })
}

const updateConsentSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  shareNotesWithMember: z.boolean().optional(),
  allowStaffContact: z.boolean().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
})

export const PATCH = withErrorHandling('/api/counseling/consent', 'PATCH', async (request: NextRequest) => {
  const parsed = updateConsentSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { userId, ...data } = parsed.data

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const consent = await prisma.counselingConsent.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  })

  return NextResponse.json({ data: serializeConsent(consent), message: 'Consent updated successfully', code: 'success', status: 200 })
})
