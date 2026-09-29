import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { serializeIntake, DETAIL_INCLUDE } from '@/lib/data/rehab-intakes'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const intake = await prisma.rehabIntake.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  if (!intake) {
    return NextResponse.json({ data: null, message: 'Intake not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(intake.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeIntake(intake), message: 'Intake fetched successfully', code: 'success', status: 200 })
}

/** Staff-only review action-discriminator: review (-> UNDER_REVIEW), createPlan (-> PLAN_CREATED), decline (-> DECLINED). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const auth = await requireStaff()
    if (auth.response) return auth.response
    const { userId: reviewerId } = auth.session

    const existing = await prisma.rehabIntake.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Intake not found', code: 'error', status: 404 }, { status: 404 })
    }

    const statusByAction: Record<string, 'UNDER_REVIEW' | 'PLAN_CREATED' | 'DECLINED'> = {
      review: 'UNDER_REVIEW',
      createPlan: 'PLAN_CREATED',
      decline: 'DECLINED',
    }
    const status = statusByAction[body.action]
    if (!status) {
      return NextResponse.json({ data: null, message: "action must be one of 'review', 'createPlan', 'decline'", code: 'error', status: 400 }, { status: 400 })
    }

    const updated = await prisma.rehabIntake.update({
      where: { id },
      data: { status, reviewedById: reviewerId, reviewNotes: typeof body.reviewNotes === 'string' ? body.reviewNotes : existing.reviewNotes },
      include: DETAIL_INCLUDE,
    })
    return NextResponse.json({ data: serializeIntake(updated), message: 'Intake updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update intake', code: 'error', status: 500 }, { status: 500 })
  }
}
