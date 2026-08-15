'use client'

import { useEffect, useState } from 'react'
import { User, BookOpen, CalendarDays, Percent, ArrowLeft, GraduationCap } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { enrollmentStatusConfig, type EnrollmentStatus } from '../../_components/enrollments-data'

interface EnrollmentDetailViewProps {
  id: string
}

interface EnrollmentDetail {
  id: string
  member: string
  courseId: string
  courseTitle: string
  enrolledAt: string
  status: string
  progress: number
}

function toDisplayStatus(status: string): EnrollmentStatus {
  return status === 'ENROLLED' ? 'ACTIVE' : (status as EnrollmentStatus)
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/**
 * Real details page for a single enrollment, replacing the modal that
 * used to open from the Enrollments table's "View" button. Fetches
 * directly from /api/enrollments/:id, matching the Users pilot's
 * pattern, so this page also works when linked to directly. Read-only —
 * the source table has no edit/delete modal for enrollments, so none is
 * added here either.
 */
export function EnrollmentDetailView({ id }: EnrollmentDetailViewProps) {
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/enrollments/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Enrollment not found')
          return
        }
        setEnrollment(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load enrollment') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Enrollment Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !enrollment) {
    return (
      <div>
        <PageHeader title="Enrollment Details" />
        <EmptyState icon={GraduationCap} title="Enrollment not found" description={error || 'This enrollment does not exist or was deleted.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/e-learning/enrollments" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Enrollments
          </UniversalButton>
        </div>
      </div>
    )
  }

  const status = toDisplayStatus(enrollment.status)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/e-learning/enrollments" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Enrollments
        </UniversalButton>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{enrollment.member}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${enrollmentStatusConfig[status].cls}`}>
            {enrollmentStatusConfig[status].label}
          </span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<BookOpen size={13} />} label="Course" value={enrollment.courseTitle} />
          <DetailRow icon={<CalendarDays size={13} />} label="Enrolled" value={enrollment.enrolledAt} />
          <DetailRow icon={<Percent size={13} />} label="Progress" value={`${enrollment.progress}%`} />
          <DetailRow icon={<User size={13} />} label="ID" value={enrollment.id} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-lato text-xs text-w-700">Course Progress</span>
            <span className="font-lato text-xs text-w-700 font-semibold">{enrollment.progress}%</span>
          </div>
          <div className="h-2 bg-w-200 rounded-full overflow-hidden">
            <div className="h-full bg-w-600 rounded-full" style={{ width: `${enrollment.progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
