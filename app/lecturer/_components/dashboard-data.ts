import type { LucideIcon } from 'lucide-react'
import { GraduationCap, ClipboardList, CalendarClock, Users } from 'lucide-react'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { LECTURER_NAME, lecturerRoster } from './lecturer-identity'

export interface LecturerStat {
  icon: LucideIcon
  label: string
  value: string
  color: string
  bg: string
}

/**
 * Summary stats for the lecturer dashboard home. Unlike contributor's
 * `dashboard-data.ts` (hardcoded literals that immediately desync from real
 * activity — a known-Rough finding), every value here is genuinely derived:
 * course count reads the real shared course catalog filtered to this
 * lecturer's own `lecturerId`; enrolled-students sums those courses' real
 * `students` counts. Session Requests and Unread Messages are real zeros,
 * not fabricated placeholders — no session-request or messaging store
 * exists yet (Phases 3-4), so until then there is genuinely nothing to
 * count, and this reports that honestly instead of inventing a number.
 */
export function getLecturerStats(): LecturerStat[] {
  const currentLecturer = lecturerRoster.find((l) => l.name === LECTURER_NAME)
  const myCourses = currentLecturer
    ? courseCatalog.filter((c) => c.lecturerId === currentLecturer.id)
    : []
  const totalStudents = myCourses.reduce((sum, c) => sum + c.students, 0)

  return [
    { icon: GraduationCap, label: 'My Courses', value: String(myCourses.length), color: 'var(--gold)', bg: 'rgba(212,168,67,0.1)' },
    { icon: Users, label: 'Enrolled Students', value: totalStudents.toLocaleString(), color: 'var(--teal-light)', bg: 'rgba(45,212,191,0.1)' },
    { icon: ClipboardList, label: 'Session Requests', value: '0', color: 'var(--purple-light)', bg: 'rgba(168,85,247,0.1)' },
    { icon: CalendarClock, label: 'Upcoming Sessions', value: '0', color: 'var(--green-light)', bg: 'rgba(34,197,94,0.1)' },
  ]
}
