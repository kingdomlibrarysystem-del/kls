/** Enrollment status vocabulary, per APP_DOC Task 6.3 / Prisma `Enrollment.status`. */
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED'

export interface Enrollment {
  id: string
  member: string
  course: string
  enrolledAt: string
  status: EnrollmentStatus
  progress: number
}

export const mockEnrollments: Enrollment[] = [
  { id: 'en-001', member: 'Jean Paul Nkurunziza', course: 'Foundations of Faith',      enrolledAt: '2026-04-02', status: 'COMPLETED', progress: 100 },
  { id: 'en-002', member: 'Amina Uwimana',        course: 'Digital Discipleship',       enrolledAt: '2026-05-11', status: 'ACTIVE',    progress: 62  },
  { id: 'en-003', member: 'Eric Habimana',         course: 'Family & Marriage 101',      enrolledAt: '2026-05-20', status: 'ACTIVE',    progress: 34  },
  { id: 'en-004', member: 'Grace Mukamana',        course: 'Leadership for Youth Pastors', enrolledAt: '2026-03-15', status: 'DROPPED', progress: 18  },
  { id: 'en-005', member: 'David Ndayisenga',      course: 'Foundations of Faith',       enrolledAt: '2026-06-01', status: 'ACTIVE',    progress: 45  },
  { id: 'en-006', member: 'Sarah Uwase',           course: 'Missions & Outreach',         enrolledAt: '2026-02-20', status: 'COMPLETED', progress: 100 },
]

export const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-50  text-green-800  border-green-200'  },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100     text-w-700      border-w-300'      },
  DROPPED:   { label: 'Dropped',   cls: 'bg-red-50    text-red-800    border-red-200'    },
}
