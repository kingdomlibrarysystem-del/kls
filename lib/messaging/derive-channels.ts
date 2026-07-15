import type { CourseEnrollment } from '@/app/member/_shared/enrollment-data'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import type { Channel, Message } from './types'

/**
 * This mock has a single live member persona — see use-enrollments.ts's
 * CURRENT_MEMBER_NAME. A course channel's real participant list is
 * therefore always exactly [that one learner, the course's lecturer]
 * today; the derivation below reads the real enrollment store rather than
 * hardcoding that pairing, so it stays correct if this app ever supports
 * multiple concurrent learners.
 */
const CURRENT_MEMBER_NAME = 'John Doe'

export function courseChannelId(courseId: string): string {
  return `course-${courseId}`
}

/**
 * Derives this person's course channels from real enrollment + lecturerId
 * data — never stored, per the confirmed design (the same "derive, don't
 * duplicate" principle getProgressPercent/isCertificateEligible already
 * use). A learner sees a channel per enrolled course; a lecturer sees a
 * channel per course they teach.
 */
export function deriveCourseChannels(personName: string, enrollments: CourseEnrollment[]): Channel[] {
  const courses = personName === CURRENT_MEMBER_NAME
    ? enrollments.map((e) => courseCatalog.find((c) => c.id === e.courseId)).filter((c): c is NonNullable<typeof c> => !!c)
    : courseCatalog.filter((c) => lecturerRoster.find((l) => l.id === c.lecturerId)?.name === personName)

  return courses.map((course) => {
    const lecturer = lecturerRoster.find((l) => l.id === course.lecturerId)
    return {
      id: courseChannelId(course.id),
      kind: 'course' as const,
      name: course.title,
      participantNames: [CURRENT_MEMBER_NAME, lecturer?.name ?? course.instructor],
      courseId: course.id,
    }
  })
}

/** This person's existing DM threads — derived from which channelIds already have messages and mention them. */
export function deriveDmChannels(personName: string, messages: Message[]): Channel[] {
  const dmIds = new Set(messages.filter((m) => m.channelId.startsWith('dm-')).map((m) => m.channelId))
  const channels: Channel[] = []
  dmIds.forEach((id) => {
    const names = id.replace(/^dm-/, '').split('__')
    if (!names.includes(personName)) return
    const other = names.find((n) => n !== personName) ?? names[0]
    channels.push({ id, kind: 'dm', name: other, participantNames: names })
  })
  return channels
}
