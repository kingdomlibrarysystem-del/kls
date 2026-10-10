import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAdmin } from '@/lib/auth/require-role'
import { isObjectId } from '@/lib/server/object-id'
import { moveUserToTrash, restoreUser } from '@/lib/data/user-trash'

type Ctx = { params: Promise<{ id: string }> }

async function findUser(id: string) {
  if (!isObjectId(id)) throw new ApiError('User not found', 404)
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, deletedAt: true } })
  if (!user) throw new ApiError('This user no longer exists — refresh the list', 404)
  return user
}

/**
 * POST /api/users/[id]/trash — admin only. Moves the account to Trash (soft
 * delete): nothing is removed, the user is signed out everywhere and cannot
 * sign in until restored. An admin cannot trash their own account.
 */
export const POST = withErrorHandling('/api/users/[id]/trash', 'POST', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { id } = await params
  if (id === auth.session.userId) throw new ApiError('You cannot move your own account to Trash', 409)
  const user = await findUser(id)
  if (user.deletedAt) throw new ApiError('This user is already in Trash', 409)
  await moveUserToTrash(id, auth.session.userId)
  return NextResponse.json({ data: { id }, message: 'User moved to Trash', code: 'success', status: 200 })
})

/** DELETE /api/users/[id]/trash — admin only. Restores the account from Trash. */
export const DELETE = withErrorHandling('/api/users/[id]/trash', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { id } = await params
  const user = await findUser(id)
  if (!user.deletedAt) throw new ApiError('This user is not in Trash', 409)
  await restoreUser(id)
  return NextResponse.json({ data: { id }, message: 'User restored', code: 'success', status: 200 })
})
