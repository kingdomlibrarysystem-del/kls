import { Tag, Globe, Users, CalendarDays, FileText, PenLine, GraduationCap } from 'lucide-react'
import { languageLabels } from '../../../add/_components/course-form-schema'
import type { CourseCatalogEntry } from '../../_components/catalog-config'

interface CourseInfoCardProps {
  course: CourseCatalogEntry
  instructorName: string
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

export function CourseInfoCard({ course, instructorName }: CourseInfoCardProps) {
  return (
    <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3 max-w-2xl">
      <DetailRow icon={<Tag size={13} />} label="Category" value={course.category} />
      <DetailRow icon={<Globe size={13} />} label="Language" value={languageLabels[course.language]} />
      <DetailRow icon={<PenLine size={13} />} label="Author" value={course.author} />
      <DetailRow icon={<GraduationCap size={13} />} label="Instructor" value={instructorName} />
      <DetailRow icon={<Users size={13} />} label="Enrolled" value={String(course.enrolledCount)} />
      <DetailRow icon={<CalendarDays size={13} />} label="Created" value={course.createdAt} />
      <DetailRow icon={<FileText size={13} />} label="ID" value={course.id} />
    </div>
  )
}
