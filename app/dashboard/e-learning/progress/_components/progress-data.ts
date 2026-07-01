export interface TopPerformer {
  name: string
  progress: number
}

export interface DropoffPoint {
  lesson: string
  dropoffRate: number
}

export interface CourseAnalytics {
  id: string
  title: string
  enrolledCount: number
  avgCompletion: number
  topPerformers: TopPerformer[]
  dropoffPoints: DropoffPoint[]
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
  },
]
