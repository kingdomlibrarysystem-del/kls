/**
 * One-off: creates two real, working login accounts for manual/agent
 * testing — an Admin and a Member — via the exact same bcrypt-hash +
 * Role shape POST /api/auth/register uses for a real member signup
 * (see that route's own docstring), so these behave identically to a
 * genuine account, not a special-cased test fixture. Safe to re-run:
 * upserts both the Role and User rows by their unique fields.
 *
 * Run via: node scripts/create-test-accounts.mjs
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const BCRYPT_ROUNDS = 12

const ADMIN_EMAIL = 'test.admin@kls.local'
const ADMIN_PASSWORD = 'TestAdmin123!'
const MEMBER_EMAIL = 'test.member@kls.local'
const MEMBER_PASSWORD = 'TestMember123!'

async function upsertAccount({ email, password, firstName, lastName, roleName, roleDescription }) {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName, description: roleDescription, permissions: [] },
  })

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: passwordHash, roleId: role.id, status: 'ACTIVE', emailVerified: new Date() },
    create: {
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      password: passwordHash,
      roleId: role.id,
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })

  return user
}

async function main() {
  const admin = await upsertAccount({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    firstName: 'Test',
    lastName: 'Admin',
    roleName: 'Admin',
    roleDescription: 'Full administrative access',
  })
  console.log(`Admin ready: ${admin.email} (id ${admin.id})`)

  const member = await upsertAccount({
    email: MEMBER_EMAIL,
    password: MEMBER_PASSWORD,
    firstName: 'Test',
    lastName: 'Member',
    roleName: 'Member',
    roleDescription: 'Default role for self-registered members',
  })
  console.log(`Member ready: ${member.email} (id ${member.id})`)

  console.log('\nLogin credentials:')
  console.log(`  Admin  — email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`)
  console.log(`  Member — email: ${MEMBER_EMAIL}  password: ${MEMBER_PASSWORD}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
