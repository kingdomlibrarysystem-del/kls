import type { LucideIcon } from 'lucide-react'
import { BookCopy, GraduationCap, FlaskConical, DollarSign } from 'lucide-react'

export interface ContributorStatConfig {
  icon: LucideIcon
  label: string
  color: string
  bg: string
}

/**
 * Icon/color config for the contributor dashboard home stat cards — the
 * values themselves are computed live in dashboard-view.tsx from the same
 * shared stores My Submissions/My Courses/My Research/Earnings each read,
 * not hardcoded here.
 */
export const contributorStatConfig: ContributorStatConfig[] = [
  { icon: BookCopy, label: 'My Submissions', color: 'var(--gold)', bg: 'rgba(212,168,67,0.1)' },
  { icon: GraduationCap, label: 'My Courses', color: 'var(--teal-light)', bg: 'rgba(45,212,191,0.1)' },
  { icon: FlaskConical, label: 'Research Projects', color: 'var(--purple-light)', bg: 'rgba(168,85,247,0.1)' },
  { icon: DollarSign, label: 'Earnings (RWF)', color: 'var(--green-light)', bg: 'rgba(34,197,94,0.1)' },
]
