'use client'

import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import type { LessonAccess } from '@/lib/course-access'

interface LessonAccessFieldsProps {
  idPrefix: string
  access: LessonAccess
  price: number
  /** The course's own price (RWF, 0 = free course) — changes how the choices read. */
  coursePrice: number
  onAccess: (access: LessonAccess) => void
  onPrice: (price: number) => void
  error?: string
}

/**
 * Who may open this lesson (rules in lib/course-access.ts). The wording
 * follows the course: in a paid course "Included" means "after paying the
 * course"; in a free course it means "free".
 */
export function LessonAccessFields({ idPrefix, access, price, coursePrice, onAccess, onPrice, error }: LessonAccessFieldsProps) {
  const paidCourse = coursePrice > 0
  const options: { value: LessonAccess; label: string }[] = [
    { value: 'COURSE', label: paidCourse ? `Included in the course price (${coursePrice.toLocaleString()} RWF)` : 'Free — like the rest of this free course' },
    { value: 'FREE', label: paidCourse ? 'Free for everyone (a free preview)' : 'Free for everyone' },
    { value: 'PAID', label: paidCourse ? 'Paid lesson — can also be bought alone' : 'Paid lesson — members buy it alone' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
      <div>
        <FieldLabel htmlFor={`${idPrefix}-access`} required>Who can open this lesson</FieldLabel>
        <select
          id={`${idPrefix}-access`}
          value={access}
          onChange={(e) => onAccess(e.target.value as LessonAccess)}
          className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {access === 'PAID' && (
        <div>
          <FieldLabel htmlFor={`${idPrefix}-price`} required>Lesson price (RWF)</FieldLabel>
          <FormInput
            id={`${idPrefix}-price`}
            type="number"
            min={1}
            step={100}
            value={Number.isFinite(price) && price > 0 ? price : ''}
            onChange={(e) => onPrice(Number(e.target.value))}
            error={error}
          />
        </div>
      )}
    </div>
  )
}
