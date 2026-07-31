/**
 * One-off Phase 3 seed script: populates the real Borrow and Reservation
 * collections from this app's current mock data, plus placeholder User
 * documents derived from the mocks' own memberName/memberEmail fields
 * (the real User collection was confirmed empty — no real auth exists yet
 * to have created any). Safe to re-run: clears all three collections
 * first (Borrow, Reservation, and only the placeholder Users this script
 * itself creates, matched by email, never all Users).
 *
 * The mock borrowings/reservations reference resourceTitle values (e.g.
 * "Ancient Civilizations", "The Pursuit of Knowledge") that do not exist
 * in the real Resource collection (Phase 2 only seeded the 16 Bible-book
 * scrolls). Per PROGRESS.md's Phase 3 entry, these are deterministically
 * mapped onto real seeded Resource rows (round-robin by index) rather
 * than left dangling — this is a reversible seed-data decision, not the
 * blocked "real current user" question documented separately.
 *
 * Run via `npx tsx prisma/seed/seed-phase3.mjs`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const adminBorrowings = [
  { id: 'b-001', memberName: 'Jean Paul Nkurunziza', memberEmail: 'jeanpaul@example.com', resourceTitle: 'The Pursuit of Knowledge', borrowDate: '2025-06-01', dueDate: '2025-06-15', returnDate: null, status: 'ACTIVE', renewalCount: 1, fineAmount: null, finePaid: false },
  { id: 'b-002', memberName: 'Amina Uwimana', memberEmail: 'amina@example.com', resourceTitle: 'Digital Transformation', borrowDate: '2025-05-10', dueDate: '2025-05-24', returnDate: null, status: 'OVERDUE', renewalCount: 2, fineAmount: 1500, finePaid: false },
  { id: 'b-003', memberName: 'Eric Habimana', memberEmail: 'eric@example.com', resourceTitle: 'Ancient Civilizations', borrowDate: '2025-06-05', dueDate: '2025-06-19', returnDate: null, status: 'ACTIVE', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-004', memberName: 'Grace Mukamana', memberEmail: 'grace@example.com', resourceTitle: 'Foundations of Faith', borrowDate: '2025-04-12', dueDate: '2025-04-26', returnDate: '2025-04-24', status: 'RETURNED', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-005', memberName: 'Claudine Ingabire', memberEmail: 'claudine@example.com', resourceTitle: 'Leading with Humility', borrowDate: '2025-06-10', dueDate: '2025-06-24', returnDate: null, status: 'PENDING', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-006', memberName: 'Patrick Iradukunda', memberEmail: 'patrick@example.com', resourceTitle: 'Kingdom Marriage Principles', borrowDate: '2025-03-20', dueDate: '2025-04-03', returnDate: null, status: 'REJECTED', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-007', memberName: 'Sarah Uwase', memberEmail: 'sarah@example.com', resourceTitle: 'Voices of the Revival', borrowDate: '2025-05-01', dueDate: '2025-05-15', returnDate: '2025-05-14', status: 'RETURNED', renewalCount: 1, fineAmount: null, finePaid: false },
  { id: 'b-008', memberName: 'David Ndayisenga', memberEmail: 'davidn@example.com', resourceTitle: 'The Discipleship Journey', borrowDate: '2025-05-02', dueDate: '2025-05-16', returnDate: null, status: 'OVERDUE', renewalCount: 0, fineAmount: 800, finePaid: true },
  { id: 'b-009', memberName: 'Alice Mutoni', memberEmail: 'alicem@example.com', resourceTitle: 'Financial Stewardship', borrowDate: '2025-06-12', dueDate: '2025-06-26', returnDate: null, status: 'ACTIVE', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-010', memberName: 'Samuel Byiringiro', memberEmail: 'samuel@example.com', resourceTitle: 'Raising Kingdom Families', borrowDate: '2025-04-01', dueDate: '2025-04-15', returnDate: '2025-04-20', status: 'RETURNED', renewalCount: 0, fineAmount: 500, finePaid: true },
  { id: 'b-011', memberName: 'Esther Kabatesi', memberEmail: 'esther@example.com', resourceTitle: 'The Kingdom Economy', borrowDate: '2025-06-15', dueDate: '2025-06-29', returnDate: null, status: 'PENDING', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-012', memberName: 'Peter Niyonzima', memberEmail: 'peter@example.com', resourceTitle: 'Divine Health & Wellness', borrowDate: '2025-06-08', dueDate: '2025-06-22', returnDate: null, status: 'ACTIVE', renewalCount: 1, fineAmount: null, finePaid: false },
]

const adminReservations = [
  { id: 'r-001', memberName: 'Jean Paul Nkurunziza', memberEmail: 'jeanpaul@example.com', resourceTitle: 'Ancient Civilizations', queuePosition: 1, status: 'NOTIFIED' },
  { id: 'r-002', memberName: 'Amina Uwimana', memberEmail: 'amina@example.com', resourceTitle: 'Ancient Civilizations', queuePosition: 2, status: 'PENDING' },
  { id: 'r-003', memberName: 'Patrick Habimana', memberEmail: 'patrick2@example.com', resourceTitle: "Inzira y'Ubumenyi", queuePosition: 1, status: 'PENDING' },
  { id: 'r-004', memberName: 'Grace Mukamana', memberEmail: 'grace@example.com', resourceTitle: 'Ancient Civilizations', queuePosition: 3, status: 'PENDING' },
  { id: 'r-005', memberName: 'Eric Nsanzimana', memberEmail: 'eric2@example.com', resourceTitle: 'Digital Transformation', queuePosition: 1, status: 'EXPIRED' },
  { id: 'r-006', memberName: 'Diane Uwase', memberEmail: 'diane@example.com', resourceTitle: 'Digital Transformation', queuePosition: 1, status: 'CLAIMED' },
  { id: 'r-007', memberName: 'Claudine Ingabire', memberEmail: 'claudine@example.com', resourceTitle: 'Foundations of Faith', queuePosition: 1, status: 'NOTIFIED' },
  { id: 'r-008', memberName: 'David Ndayisenga', memberEmail: 'davidn@example.com', resourceTitle: 'Foundations of Faith', queuePosition: 2, status: 'PENDING' },
  { id: 'r-009', memberName: 'Sarah Uwase', memberEmail: 'sarah@example.com', resourceTitle: 'Leading with Humility', queuePosition: 1, status: 'CLAIMED' },
  { id: 'r-010', memberName: 'Peter Niyonzima', memberEmail: 'peter@example.com', resourceTitle: 'The Kingdom Economy', queuePosition: 1, status: 'EXPIRED' },
  { id: 'r-011', memberName: 'Esther Kabatesi', memberEmail: 'esther@example.com', resourceTitle: 'Walking in Covenant', queuePosition: 1, status: 'PENDING' },
  { id: 'r-012', memberName: 'Samuel Byiringiro', memberEmail: 'samuel@example.com', resourceTitle: 'Walking in Covenant', queuePosition: 2, status: 'CANCELLED' },
]

async function main() {
  console.log('Clearing existing Borrow/Reservation collections...')
  await prisma.borrow.deleteMany({})
  await prisma.reservation.deleteMany({})

  const resources = await prisma.resource.findMany({ select: { id: true, title: true } })
  if (resources.length === 0) {
    throw new Error('No Resource rows found — run seed-phase2 first (Phase 2 seeds the real Resource collection this script maps mock titles onto).')
  }
  console.log(`Found ${resources.length} real resources to map mock titles onto (round-robin, since mock titles don't match real seeded titles).`)

  const allEmails = [...new Set([...adminBorrowings, ...adminReservations].map((r) => r.memberEmail))]
  console.log(`Seeding ${allEmails.length} placeholder Users from mock memberName/memberEmail (real auth does not exist yet — see PROGRESS.md's Phase 3 rule-2 blocker)...`)
  await prisma.user.deleteMany({ where: { email: { in: allEmails } } })
  const emailToUserId = new Map()
  for (const email of allEmails) {
    const source = [...adminBorrowings, ...adminReservations].find((r) => r.memberEmail === email)
    const [firstName, ...rest] = source.memberName.trim().split(/\s+/)
    const created = await prisma.user.create({
      data: { name: source.memberName, firstName, lastName: rest.join(' '), email },
    })
    emailToUserId.set(email, created.id)
  }

  console.log(`Seeding ${adminBorrowings.length} borrowings...`)
  for (let i = 0; i < adminBorrowings.length; i++) {
    const b = adminBorrowings[i]
    const resource = resources[i % resources.length]
    await prisma.borrow.create({
      data: {
        userId: emailToUserId.get(b.memberEmail),
        memberName: b.memberName,
        memberEmail: b.memberEmail,
        resourceId: resource.id,
        borrowDate: new Date(b.borrowDate),
        dueDate: new Date(b.dueDate),
        returnDate: b.returnDate ? new Date(b.returnDate) : null,
        status: b.status,
        renewalCount: b.renewalCount,
        fineAmount: b.fineAmount,
        finePaid: b.finePaid,
      },
    })
  }

  console.log(`Seeding ${adminReservations.length} reservations...`)
  for (let i = 0; i < adminReservations.length; i++) {
    const r = adminReservations[i]
    const resource = resources[(i + 3) % resources.length]
    const notifiedAt = r.status === 'NOTIFIED' || r.status === 'CLAIMED' || r.status === 'EXPIRED' ? new Date() : null
    const claimDeadline = r.status === 'NOTIFIED' ? new Date(Date.now() + 48 * 3600000) : null
    await prisma.reservation.create({
      data: {
        userId: emailToUserId.get(r.memberEmail),
        memberName: r.memberName,
        memberEmail: r.memberEmail,
        resourceId: resource.id,
        queuePosition: r.queuePosition,
        status: r.status,
        notifiedAt,
        claimDeadline,
      },
    })
  }

  const userCount = await prisma.user.count()
  const borrowCount = await prisma.borrow.count()
  const reservationCount = await prisma.reservation.count()
  console.log(`Done. User count: ${userCount}, Borrow count: ${borrowCount}, Reservation count: ${reservationCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
