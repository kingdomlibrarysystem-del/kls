import { z } from 'zod'
import { DAILY_WISDOM_LANGUAGES, VERSE_REFERENCE_MAX, VERSE_TEXT_MAX, isDateKey } from '@/lib/daily-wisdom-shared'

/** Body shared by POST /api/daily-wisdom/verses and PATCH /api/daily-wisdom/verses/[id]. */
const verseFields = {
  text: z.string().trim().min(5, 'The verse must be at least 5 characters').max(VERSE_TEXT_MAX, 'The verse is too long'),
  reference: z.string().trim().min(2, 'Add the reference, e.g. John 3:16').max(VERSE_REFERENCE_MAX, 'The reference is too long'),
  language: z.enum(DAILY_WISDOM_LANGUAGES),
  /** "YYYY-MM-DD" to send the verse for that day; null to add it to the automatic rotation. */
  scheduledDate: z.string().refine(isDateKey, 'Pick a valid date').nullable(),
  active: z.boolean(),
}

export const createVerseSchema = z.object({ ...verseFields, active: verseFields.active.default(true) })
export const updateVerseSchema = z.object(verseFields).partial()
