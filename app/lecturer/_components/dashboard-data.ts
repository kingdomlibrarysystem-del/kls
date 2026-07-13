import type { LucideIcon } from 'lucide-react'
import { GraduationCap, ClipboardList, CalendarClock, Users } from 'lucide-react'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { useSessionRequests } from '@/app/lecturer/_shared/use-session-requests'
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
 * `students` counts; Session Requests/Upcoming Sessions read the real
 * `useSessionRequests()` store, filtered by `lecturerName` the same way
 * `session-requests-view.tsx` (PENDING) and `lecturer-sessions-view.tsx`
 * (APPROVED, i.e. "upcoming") already filter it for their own pages — so
 * this card's count can never visibly disagree with the page one click
 * away. This is a hook (not a plain function) specifically so it
 * subscribes live to that `useSyncExternalStore`-backed store, matching
 * every other real stat card in this app.
 */
export function useLecturerStats(): LecturerStat[] {
  const requests = useSessionRequests()
  const currentLecturer = lecturerRoster.find((l) => l.name === LECTURER_NAME)
  const myCourses = currentLecturer
    ? courseCatalog.filter((c) => c.lecturerId === currentLecturer.id)
    : []
  const totalStudents = myCourses.reduce((sum, c) => sum + c.students, 0)
  const mine = requests.filter((r) => r.lecturerName === LECTURER_NAME)
  const pendingCount = mine.filter((r) => r.status === 'PENDING').length
  const upcomingCount = mine.filter((r) => r.status === 'APPROVED').length

  return [
    { icon: GraduationCap, label: 'My Courses', value: String(myCourses.length), color: 'var(--gold)', bg: 'rgba(212,168,67,0.1)' },
    { icon: Users, label: 'Enrolled Students', value: totalStudents.toLocaleString(), color: 'var(--teal-light)', bg: 'rgba(45,212,191,0.1)' },
    { icon: ClipboardList, label: 'Session Requests', value: String(pendingCount), color: 'var(--purple-light)', bg: 'rgba(168,85,247,0.1)' },
    { icon: CalendarClock, label: 'Upcoming Sessions', value: String(upcomingCount), color: 'var(--green-light)', bg: 'rgba(34,197,94,0.1)' },
  ]
}
