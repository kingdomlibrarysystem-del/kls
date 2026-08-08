import type { CourseEnrollment } from '@/app/member/_shared/use-enrollments'
import type { CatalogCourse } from '@/app/member/_shared/use-courses'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import type { Channel, Message } from './types'

export function courseChannelId(courseId: string): string {
  return `course-${courseId}`
}

/**
 * Derives this person's course channels from real enrollment + lecturerId
 * data — never stored, per the confirmed design (the same "derive, don't
 * duplicate" principle getProgressPercent/isCertificateEligible already
 * use). A learner sees a channel per enrolled course; a lecturer sees a
 * channel per course they teach. `enrollments`/`courseCatalog` are now
 * passed in by the caller (both come from real fetch hooks — see
 * use-messages.ts's useChannelsFor) rather than read from a module-level
 * mock array, since app/member/_shared/use-enrollments.ts and
 * use-courses.ts moved to real /api/enrollments and /api/courses fetches.
 */
export function deriveCourseChannels(personName: string, enrollments: CourseEnrollment[], courseCatalog: CatalogCourse[]): Channel[] {
  const courses = enrollments.length > 0
    ? enrollments.map((e) => courseCatalog.find((c) => c.id === e.courseId)).filter((c): c is NonNullable<typeof c> => !!c)
    : courseCatalog.filter((c) => lecturerRoster.find((l) => l.id === c.lecturerId)?.name === personName)

  return courses.map((course) => {
    const lecturer = lecturerRoster.find((l) => l.id === course.lecturerId)
    return {
      id: courseChannelId(course.id),
      kind: 'course' as const,
      name: course.title,
      participantNames: [personName, lecturer?.name ?? course.instructor],
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
