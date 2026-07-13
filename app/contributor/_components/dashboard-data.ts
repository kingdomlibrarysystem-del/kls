import type { LucideIcon } from 'lucide-react'
import { BookCopy, GraduationCap, FlaskConical, DollarSign } from 'lucide-react'

export interface ContributorStat {
  icon: LucideIcon
  label: string
  value: string
  color: string
  bg: string
}

/**
 * Summary stats for the contributor dashboard home, drawn from the same
 * contributor identity ("Pastor Emmanuel Rugamba") used elsewhere in the
 * admin-side publishing/revenue/research mock data.
 */
export const contributorStats: ContributorStat[] = [
  { icon: BookCopy, label: 'My Submissions', value: '4', color: 'var(--gold)', bg: 'rgba(212,168,67,0.1)' },
  { icon: GraduationCap, label: 'My Courses', value: '1', color: 'var(--teal-light)', bg: 'rgba(45,212,191,0.1)' },
  { icon: FlaskConical, label: 'Research Projects', value: '2', color: 'var(--purple-light)', bg: 'rgba(168,85,247,0.1)' },
  { icon: DollarSign, label: 'Earnings (RWF)', value: '383,000', color: 'var(--green-light)', bg: 'rgba(34,197,94,0.1)' },
]
