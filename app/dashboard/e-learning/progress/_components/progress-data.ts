export interface TopPerformer {
  name: string
  progress: number
}

export interface DropoffPoint {
  lesson: string
  dropoffRate: number
}

/** One enrolled member's full standing in a course — the complete roster, not just the top performers. */
export interface EnrolledMember {
  name: string
  progress: number
  status: 'ENROLLED' | 'COMPLETED' | 'DROPPED'
}

export interface CourseAnalytics {
  id: string
  title: string
  enrolledCount: number
  avgCompletion: number
  /** Top 3 by progress — shown directly on the card. */
  topPerformers: TopPerformer[]
  /** Top 1-2 lessons by dropoff rate — shown directly on the card. */
  dropoffPoints: DropoffPoint[]
  /** Every enrolled member, for the full-roster details view. */
  enrolledMembers: EnrolledMember[]
  /** Dropoff rate at every lesson in the course, for the full details view. */
  allDropoffPoints: DropoffPoint[]
}
