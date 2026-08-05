/**
 * One-off Phase 7 seed script: creates one real Channel per real Course
 * (kind COURSE — participantIds = [that course's real lecturerId, plus
 * every real Enrollment's userId for that course]), and seeds the 5
 * mock Notification rows. There is no seed Message data to migrate —
 * lib/messaging/use-messages.ts's mock store starts genuinely empty
 * (`let allMessages: Message[] = []`), confirmed by reading the file
 * directly before writing this script.
 *
 * Run via `npx tsx prisma/seed/seed-phase7.mjs`.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const notifications = [
  { type: 'BORROW', title: 'Borrow Approved', message: 'Your borrow request for "Digital Transformation" has been approved.', href: '/dashboard/library/borrowings', recipientRole: 'admin' },
  { type: 'DUE', title: 'Book Due Soon', message: '"The Pursuit of Knowledge" is due in 3 days. Consider renewing.', href: '/dashboard/library/borrowings', recipientRole: 'admin' },
  { type: 'RESERVATION', title: 'Reservation Available', message: '"Ancient Civilizations" is now available. Claim it within 48 hours.', href: '/dashboard/reservations', recipientRole: 'admin' },
  { type: 'COURSE', title: 'Course Enrollment', message: 'Amina Uwimana has enrolled in "Digital Discipleship".', href: '/dashboard/e-learning/enrollments', recipientRole: 'admin' },
  { type: 'PUBLICATION', title: 'Publication Approved', message: '"Voices of the Revival" has been approved for publishing.', href: '/dashboard/publishing/catalog', recipientRole: 'admin' },
]

async function main() {
  console.log('Clearing existing Channel/Message/Notification collections...')
  await prisma.message.deleteMany({})
  await prisma.channel.deleteMany({})
  await prisma.notification.deleteMany({})

  const courses = await prisma.course.findMany({ where: { lecturerId: { not: null } }, select: { id: true, title: true, lecturerId: true } })
  console.log(`Seeding ${courses.length} course channels (courses with a real lecturerId)...`)
  for (const course of courses) {
    const enrollments = await prisma.enrollment.findMany({ where: { courseId: course.id }, select: { userId: true } })
    const participantIds = [...new Set([course.lecturerId, ...enrollments.map((e) => e.userId)])]
    await prisma.channel.create({
      data: {
        kind: 'COURSE',
        name: course.title,
        participantIds,
        courseId: course.id,
      },
    })
  }

  console.log(`Seeding ${notifications.length} notifications...`)
  for (const n of notifications) {
    await prisma.notification.create({ data: n })
  }

  const counts = await Promise.all([prisma.channel.count(), prisma.message.count(), prisma.notification.count()])
  console.log(`Done. Channel: ${counts[0]}, Message: ${counts[1]}, Notification: ${counts[2]}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
