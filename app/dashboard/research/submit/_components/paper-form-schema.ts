import { z } from 'zod'

export const paperSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  abstract: z.string().min(20, 'Abstract must be at least 20 characters'),
  keywords: z.string().min(1, 'Add at least one keyword'),
  projectId: z.string().min(1, 'Select a linked project'),
})

export type PaperFormData = z.infer<typeof paperSchema>

/** Splits a comma-separated keyword string into a trimmed, non-empty tag list. */
export function parseKeywords(raw: string): string[] {
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
}

/** Mock projects a paper can be linked to, per APP_DOC Task 7.1 / Prisma `ResearchProject`. */
export interface ResearchProjectOption {
  id: string
  title: string
}

export const mockProjectOptions: ResearchProjectOption[] = [
  { id: 'proj-001', title: 'Faith & Technology in Rural Rwanda' },
  { id: 'proj-002', title: 'Discipleship Retention Among Youth' },
  { id: 'proj-003', title: 'Oral History of the East African Revival' },
]
