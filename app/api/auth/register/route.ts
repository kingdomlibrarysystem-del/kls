import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/client'

/**
 * Real member self-registration, replacing
 * contexts/auth-context.tsx's register() (which only fabricated a User
 * object in localStorage — no database write, no email). Creates a
 * real User row with a bcrypt-hashed password, assigned to a "Member"
 * Role (created on first use, since the Role collection currently has
 * no seeded rows at all — confirmed via a direct query before writing
 * this route).
 *
 * Email verification is NOT implemented here: no email-sending service
 * is wired anywhere in this app yet (Nodemailer credentials exist in
 * .env but nothing calls them), so `emailVerified` stays null. The
 * frontend's "check your email" copy is misleading until that's built
 * as its own task — flagging this rather than fabricating a fake send.
 */
const BCRYPT_ROUNDS = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, password } = body

    if (!fullName || !email || !password) {
      return NextResponse.json({ data: null, message: 'Missing required fields: fullName, email, password', code: 'error', status: 400 }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ data: null, message: 'Password must be at least 8 characters', code: 'error', status: 400 }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ data: null, message: 'An account with this email already exists', code: 'error', status: 409 }, { status: 409 })
    }

    const memberRole = await prisma.role.upsert({
      where: { name: 'Member' },
      update: {},
      create: { name: 'Member', description: 'Default role for self-registered members', permissions: [] },
    })

    const [firstName, ...rest] = String(fullName).trim().split(/\s+/)
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        name: fullName,
        firstName: firstName || fullName,
        lastName: rest.join(' '),
        email,
        password: passwordHash,
        roleId: memberRole.id,
      },
    })

    return NextResponse.json({
      data: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      message: 'Account created successfully',
      code: 'success',
      status: 201,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create account', code: 'error', status: 500 }, { status: 500 })
  }
}
