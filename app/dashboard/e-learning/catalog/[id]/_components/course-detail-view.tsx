'use client'

import { useState } from 'react'
import { ArrowLeft, Pencil, Archive, BookX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { EditCourseModal } from '../../_components/edit-course-modal'
import { ArchiveCourseModal } from '../../_components/archive-course-modal'
import { archiveCourseInCatalog, refetchCourseCatalog } from '../../../_shared/use-course-catalog'
import { statusConfig, type CourseCatalogEntry } from '../../_components/catalog-config'
import { CourseInfoCard } from './course-info-card'
import { CourseRelatedPanels } from './course-related-panels'
import type { CourseLessonRow } from './course-lessons-panel'
import type { EnrollmentRecord } from '../../../enrollments/_components/use-enrollments-admin'

interface CourseDetailViewProps {
  /** GET /api/courses/[id] shape, loaded on the server by page.tsx (which 404s when missing). */
  initialCourse: CourseApiResponse
  /** This course's lessons/enrollments for the related panels, loaded server-side alongside the course. */
  lessons: CourseLessonRow[]
  enrollments: EnrollmentRecord[]
}

export interface CourseApiResponse {
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
  /** Lecturer display name, resolved server-side by serializeCourse. */
  instructor?: string
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

async function fetchCourse(id: string): Promise<CourseApiResponse | null> {
  const res = await fetch(`/api/courses/${id}`)
  const json = await res.json()
  if (json.code !== 'success' || !json.data) return null
  return json.data
}

/**
 * Real details page for a single catalog course, replacing the modal that
 * used to open from the catalog table's "View" button. The course arrives
 * from the server page. The instructor name comes from the course payload
 * itself (serializeCourse resolves it) instead of downloading the full
 * user list via useUsers() just to look one name up.
 */
export function CourseDetailView({ initialCourse, lessons, enrollments }: CourseDetailViewProps) {
  const id = initialCourse.id
  const [course, setCourse] = useState<CourseCatalogEntry | null>(() => toCatalogEntry(initialCourse))
  const [instructor, setInstructor] = useState(initialCourse.instructor)
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)

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

  if (!course) {
    return (
      <div>
        <PageHeader title="Course Details" />
        <EmptyState icon={BookX} title="Course not found" description="This course does not exist or was deleted." />
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
          instructorName={course.lecturerId ? (instructor || '—') : 'None assigned'}
        />

        <CourseRelatedPanels courseId={course.id} lessons={lessons} enrollments={enrollments} />
      </div>

      <EditCourseModal
        course={editing ? course : null}
        onClose={async () => {
          setEditing(false)
          await refetchCourseCatalog()
          const fresh = await fetchCourse(id)
          if (fresh) {
            setCourse(toCatalogEntry(fresh))
            setInstructor(fresh.instructor)
          }
        }}
      />
      <ArchiveCourseModal course={archiving ? course : null} onClose={() => setArchiving(false)} onConfirm={handleArchiveConfirm} />
    </div>
  )
}
