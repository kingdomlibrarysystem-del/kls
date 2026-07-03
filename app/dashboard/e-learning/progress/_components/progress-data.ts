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
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
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

export const courseAnalytics: CourseAnalytics[] = [
  {
    id: 'crs-001',
    title: 'Foundations of Faith',
    enrolledCount: 48,
    avgCompletion: 78,
    topPerformers: [
      { name: 'Jean Paul Nkurunziza', progress: 100 },
      { name: 'David Ndayisenga', progress: 96 },
      { name: 'Sarah Uwase', progress: 91 },
    ],
    dropoffPoints: [{ lesson: 'Lesson 4: Covenant & Community', dropoffRate: 22 }],
    enrolledMembers: [
      { name: 'Jean Paul Nkurunziza', progress: 100, status: 'COMPLETED' },
      { name: 'David Ndayisenga', progress: 96, status: 'COMPLETED' },
      { name: 'Sarah Uwase', progress: 91, status: 'COMPLETED' },
      { name: 'Amina Uwimana', progress: 85, status: 'ACTIVE' },
      { name: 'Eric Habimana', progress: 74, status: 'ACTIVE' },
      { name: 'Grace Mukamana', progress: 60, status: 'ACTIVE' },
      { name: 'Claudine Ingabire', progress: 42, status: 'ACTIVE' },
      { name: 'Patrick Iradukunda', progress: 28, status: 'DROPPED' },
    ],
    allDropoffPoints: [
      { lesson: 'Lesson 1: Origins and Covenant', dropoffRate: 4 },
      { lesson: 'Lesson 2: Identity and Authority', dropoffRate: 9 },
      { lesson: 'Lesson 3: Reading Guide', dropoffRate: 12 },
      { lesson: 'Lesson 4: Covenant & Community', dropoffRate: 22 },
      { lesson: 'Lesson 5: Covenant in Practice', dropoffRate: 15 },
    ],
  },
  {
    id: 'crs-002',
    title: 'Digital Discipleship',
    enrolledCount: 31,
    avgCompletion: 54,
    topPerformers: [
      { name: 'Amina Uwimana', progress: 88 },
      { name: 'Patrick Iradukunda', progress: 74 },
      { name: 'Claudine Ingabire', progress: 69 },
    ],
    dropoffPoints: [
      { lesson: 'Lesson 2: Online Community Building', dropoffRate: 31 },
      { lesson: 'Lesson 6: Final Assessment', dropoffRate: 18 },
    ],
    enrolledMembers: [
      { name: 'Amina Uwimana', progress: 88, status: 'ACTIVE' },
      { name: 'Patrick Iradukunda', progress: 74, status: 'ACTIVE' },
      { name: 'Claudine Ingabire', progress: 69, status: 'ACTIVE' },
      { name: 'Jean Paul Nkurunziza', progress: 55, status: 'ACTIVE' },
      { name: 'Eric Habimana', progress: 33, status: 'DROPPED' },
      { name: 'Sarah Uwase', progress: 20, status: 'DROPPED' },
    ],
    allDropoffPoints: [
      { lesson: 'Lesson 1: Intro to Digital Discipleship', dropoffRate: 6 },
      { lesson: 'Lesson 2: Online Community Building', dropoffRate: 31 },
      { lesson: 'Lesson 3: Digital Tools for Mentorship', dropoffRate: 11 },
      { lesson: 'Lesson 4: Boundaries Online', dropoffRate: 8 },
      { lesson: 'Lesson 5: Case Studies', dropoffRate: 14 },
      { lesson: 'Lesson 6: Final Assessment', dropoffRate: 18 },
    ],
  },
  {
    id: 'crs-003',
    title: 'Family & Marriage 101',
    enrolledCount: 22,
    avgCompletion: 63,
    topPerformers: [
      { name: 'Eric Habimana', progress: 92 },
      { name: 'Grace Mukamana', progress: 80 },
    ],
    dropoffPoints: [{ lesson: 'Lesson 3: Conflict Resolution', dropoffRate: 27 }],
    enrolledMembers: [
      { name: 'Eric Habimana', progress: 92, status: 'COMPLETED' },
      { name: 'Grace Mukamana', progress: 80, status: 'ACTIVE' },
      { name: 'David Ndayisenga', progress: 61, status: 'ACTIVE' },
      { name: 'Amina Uwimana', progress: 45, status: 'ACTIVE' },
      { name: 'Claudine Ingabire', progress: 19, status: 'DROPPED' },
    ],
    allDropoffPoints: [
      { lesson: 'Lesson 1: Marriage as Covenant', dropoffRate: 5 },
      { lesson: 'Lesson 2: Communication and Conflict', dropoffRate: 13 },
      { lesson: 'Lesson 3: Conflict Resolution', dropoffRate: 27 },
      { lesson: 'Lesson 4: Roles and Mutual Submission', dropoffRate: 9 },
    ],
  },
  {
    id: 'crs-004',
    title: 'Leadership for Youth Pastors',
    enrolledCount: 17,
    avgCompletion: 41,
    topPerformers: [{ name: 'David Ndayisenga', progress: 85 }],
    dropoffPoints: [
      { lesson: 'Lesson 1: Vision Casting', dropoffRate: 15 },
      { lesson: 'Lesson 5: Delegation & Trust', dropoffRate: 44 },
    ],
    enrolledMembers: [
      { name: 'David Ndayisenga', progress: 85, status: 'ACTIVE' },
      { name: 'Sarah Uwase', progress: 52, status: 'ACTIVE' },
      { name: 'Jean Paul Nkurunziza', progress: 30, status: 'ACTIVE' },
      { name: 'Patrick Iradukunda', progress: 12, status: 'DROPPED' },
    ],
    allDropoffPoints: [
      { lesson: 'Lesson 1: Vision Casting', dropoffRate: 15 },
      { lesson: 'Lesson 2: Building a Youth Team', dropoffRate: 9 },
      { lesson: 'Lesson 3: Mentorship Models', dropoffRate: 11 },
      { lesson: 'Lesson 4: Handling Conflict in Ministry', dropoffRate: 21 },
      { lesson: 'Lesson 5: Delegation & Trust', dropoffRate: 44 },
    ],
  },
]
