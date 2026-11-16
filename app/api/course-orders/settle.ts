import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { orderPaidEmailHtml, orderFailedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

interface SettleInput {
  paypackStatus?: string
  paypackProvider?: string
  /** Normalized 'successful' | 'failed' | anything else = still pending — shared vocabulary between PayPack's own status strings and the poll route's own Stripe-status normalization, so this function doesn't need to know which rail produced it. */
  providerStatus: string
}

/**
 * Single settlement path shared by the PayPack webhook, the Stripe
 * webhook, and the GET status-poll route — whichever one learns a
 * CourseOrder settled PAID also creates (or flips) the linked Enrollment
 * to paid, so "pay to enroll" resolves the same way regardless of which
 * rail confirmed it first. Idempotent: re-settling an already-PAID order
 * is a no-op past the first call (its Enrollment already exists/paid).
 */
export async function settleCourseOrder(orderId: string, input: SettleInput) {
  const order = await prisma.courseOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('CourseOrder not found')

  const isSuccessful = input.providerStatus === 'successful'
  const isFailed = input.providerStatus === 'failed'

  const updated = await prisma.courseOrder.update({
    where: { id: orderId },
    data: {
      ...(input.paypackStatus && { paypackStatus: input.paypackStatus }),
      ...(input.paypackProvider && { paypackProvider: input.paypackProvider }),
      ...(isSuccessful && { status: 'PAID', paidAt: new Date() }),
      ...(isFailed && { status: 'FAILED' }),
    },
  })

  if (isSuccessful && order.status !== 'PAID') {
    const course = await prisma.course.findUnique({ where: { id: order.courseId }, include: { _count: { select: { lessons: true } } } })
    if (course && order.lessonId) {
      // One lesson bought: add it to the member's unlocked lessons (enrolling them if needed).
      const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: order.userId, courseId: order.courseId } } })
      if (existing) {
        const unlocked = [...new Set([...(existing.unlockedLessonIds ?? []), order.lessonId])]
        await prisma.enrollment.update({ where: { id: existing.id }, data: { unlockedLessonIds: unlocked, ...(existing.status === 'DROPPED' && { status: 'ENROLLED' }) } })
      } else {
        await prisma.enrollment.create({
          data: { userId: order.userId, courseId: order.courseId, totalLessons: course._count.lessons, completedLessonIds: [], status: 'ENROLLED', paid: !(course.price > 0), unlockedLessonIds: [order.lessonId] },
        })
      }
    } else if (course) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
        create: { userId: order.userId, courseId: order.courseId, totalLessons: course._count.lessons, completedLessonIds: [], status: 'ENROLLED', paid: true },
        update: { paid: true },
      })
    }

    const courseUrl = `${appBaseUrl()}/member/courses`
    await notifyUser({
      userId: order.userId,
      type: 'COURSE',
      category: 'course-payment-success',
      title: 'Payment confirmed',
      message: order.lessonTitle
        ? `Your payment for the lesson "${order.lessonTitle}" (${order.courseTitle}) was successful — it is open now.`
        : `Your payment for "${order.courseTitle}" was successful — you're enrolled.`,
      href: '/member/courses',
      email: { subject: 'Your course payment is confirmed', html: orderPaidEmailHtml(order.buyerName, order.courseTitle, order.amountRwf, courseUrl) },
    })
  } else if (isFailed && order.status !== 'FAILED') {
    const courseUrl = `${appBaseUrl()}/member/e-learning`
    await notifyUser({
      userId: order.userId,
      type: 'COURSE',
      category: 'course-payment-failed',
      title: 'Payment failed',
      message: `Your payment for "${order.courseTitle}" could not be completed.`,
      href: '/member/e-learning',
      email: { subject: 'Your course payment failed', html: orderFailedEmailHtml(order.buyerName, order.courseTitle, courseUrl) },
    })
  }

  return updated
}
