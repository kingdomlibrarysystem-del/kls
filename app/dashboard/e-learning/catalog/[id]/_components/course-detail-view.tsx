'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Archive, BookX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useUsers } from '@/app/dashboard/users/_components/use-users'
import { EditCourseModal } from '../../_components/edit-course-modal'
import { ArchiveCourseModal } from '../../_components/archive-course-modal'
import { archiveCourseInCatalog, refetchCourseCatalog } from '../../../_shared/use-course-catalog'
import { statusConfig, type CourseCatalogEntry } from '../../_components/catalog-config'
import { CourseInfoCard } from './course-info-card'
import { CourseRelatedPanels } from './course-related-panels'

interface CourseDetailViewProps {
  id: string
}

interface CourseApiResponse {
  id: string
  title: string
  description: string
  category: string
  language: CourseCatalogEntry['language']
  status: CourseCatalogEntry['status']
  author: string
  lecturerId?: string
  createdAt: string
  students?: number
}

function toCatalogEntry(d: CourseApiResponse): CourseCatalogEntry {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    category: d.category,
    language: d.language,
    status: d.status,
    enrolledCount: d.students ?? 0,
    createdAt: d.createdAt,
    author: d.author,
    lecturerId: d.lecturerId,
  }
}

async function fetchCourse(id: string): Promise<CourseCatalogEntry | null> {
  const res = await fetch(`/api/courses/${id}`)
  const json = await res.json()
  if (json.code !== 'success' || !json.data) return null
  return toCatalogEntry(json.data)
}

/**
 * Real details page for a single catalog course, replacing the modal that
 * used to open from the catalog table's "View" button. Fetches directly
 * from /api/courses/:id (rather than looking the row up out of the
 * already-loaded catalog list) so this page also works when linked to
 * directly without the list having loaded first.
 */
export function CourseDetailView({ id }: CourseDetailViewProps) {
  const { users } = useUsers()
  const [course, setCourse] = useState<CourseCatalogEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchCourse(id)
      .then((entry) => {
        if (cancelled) return
        if (!entry) {
          setError('Course not found')
          return
        }
        setCourse(entry)
      })
      .catch(() => { if (!cancelled) setError('Failed to load course') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const handleArchiveConfirm = async () => {
    if (course) {
      try {
        await archiveCourseInCatalog(course.id)
        setCourse((prev) => (prev ? { ...prev, status: 'DRAFT' } : prev))
      } catch {
        /* real error surfaced via the catalog hook's own error state elsewhere */
      }
    }
    setArchiving(false)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Course Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div>
        <PageHeader title="Course Details" />
        <EmptyState icon={BookX} title="Course not found" description={error || 'This course does not exist or was deleted.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/e-learning/catalog" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Catalog
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/e-learning/catalog" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Catalog
        </UniversalButton>
        <div className="flex gap-2">
          <UniversalButton variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
            Edit
          </UniversalButton>
          <UniversalButton variant="destructive" size="sm" icon={<Archive size={13} />} onClick={() => setArchiving(true)}>
            Archive
          </UniversalButton>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{course.title}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${statusConfig[course.status].cls}`}>
            {statusConfig[course.status].label}
          </span>
        </div>

        <p className="font-lato text-sm text-w-700 leading-relaxed max-w-2xl">{course.description}</p>

        <CourseInfoCard
          course={course}
          instructorName={course.lecturerId ? (users.find((u) => u.id === course.lecturerId)?.name ?? '—') : 'None assigned'}
        />

        <CourseRelatedPanels courseId={course.id} />
      </div>

      <EditCourseModal
        course={editing ? course : null}
        onClose={async () => {
          setEditing(false)
          await refetchCourseCatalog()
          const entry = await fetchCourse(id)
          if (entry) setCourse(entry)
        }}
      />
      <ArchiveCourseModal course={archiving ? course : null} onClose={() => setArchiving(false)} onConfirm={handleArchiveConfirm} />
    </div>
  )
}
