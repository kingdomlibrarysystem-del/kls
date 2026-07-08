import { z } from 'zod'

/**
 * `response` covers all three submission formats (TEXT/LINK/FILE_REF) as
 * one string field — the view renders a different input (textarea vs URL
 * field) per format, but the underlying form value is always text, matching
 * how the value is persisted (see use-assessment-attempts.ts's PROJECT
 * branch, which stores it under `openAnswers` alongside OPEN-question text).
 */
export const projectSubmissionSchema = z.object({
  response: z.string().min(1, 'A submission is required'),
})

export type ProjectSubmissionData = z.infer<typeof projectSubmissionSchema>
