import { refreshReadableContent } from '@/app/member/_shared/use-readable-content'
import { refetchResources } from './use-resources'
import type { ResourceFormData } from './resource-form-schema'

type FormChapter = ResourceFormData['chapters'][number]

/**
 * The chapter entries an admin actually meant to save: empty rows (no title
 * AND no content) are dropped, because clicking "Add Chapter" without typing
 * anything should not create a blank chapter. Only a TEXT resource has real
 * chapter content — for any other mediaType the editor hides the chapter
 * fields, so there is nothing to reconcile.
 */
export function realChaptersFrom(formData: Pick<ResourceFormData, 'mediaType' | 'chapters'>): FormChapter[] {
  return formData.mediaType === 'TEXT'
    ? formData.chapters.filter((c) => c.title.trim() || c.content.trim())
    : []
}

/**
 * The chapter title actually sent to the API, falling back to a positional
 * "Chapter N" when the admin typed body text but left the title blank.
 *
 * POST /api/chapters validates `title` as non-empty, so a content-only
 * chapter was rejected with a 400 — and because the create/edit flow fired
 * that request without checking the response, the rejection was silent: the
 * Resource was created and the admin saw a success toast, but the book ended
 * up with zero Chapter rows and therefore no Read button and nothing to read.
 * The chapter's own text is never dropped here, only the blank title is
 * replaced with something a human would have called it anyway.
 */
function chapterTitle(chapter: FormChapter, index: number): string {
  return chapter.title.trim() || `Chapter ${index + 1}`
}

async function chapterRequest(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) {
    // Surface WHY rather than letting the admin believe a book saved. The
    // previous fire-and-forget version ignored this entirely, which is how a
    // rejected chapter POST turned into a silently content-less book.
    let detail = ''
    try {
      const json = await res.json()
      if (json?.message) detail = ` — ${json.message}`
    } catch {
      // Non-JSON error body; the status alone still tells the admin something failed.
    }
    throw new Error(`Could not save the book's text (HTTP ${res.status})${detail}.`)
  }
}

/**
 * Reconciles the chapters typed in the Resource form against the real Chapter
 * rows for this resource: updates matching positions in place, creates any
 * entries beyond the existing rows, and deletes rows the editor removed. The
 * POST route auto-assigns `order` as "next after this resource's last", so
 * appended chapters land in the order they were typed.
 *
 * Shared by both places the Resource form can be saved from. It used to exist
 * only inside library-view.tsx (the Book Inventory table), while the
 * single-resource page at /dashboard/library/[id] destructured `chapters`
 * straight out of the form data and threw them away — so authoring a TEXT
 * book from that page's Edit button silently discarded every chapter with no
 * error, which is how a book could end up saved as readable-looking but with
 * zero actual content and therefore no way to read it.
 */
export async function syncResourceChapters(resourceId: string, chapters: FormChapter[]): Promise<void> {
  const chaptersRes = await fetch(`/api/chapters?resourceId=${encodeURIComponent(resourceId)}`)
  if (!chaptersRes.ok) throw new Error('Could not load the existing chapters to save against.')
  const chaptersJson = await chaptersRes.json()
  const existing: { id: string }[] = chaptersJson.data?.chapters ?? []

  // In-place update of the overlapping range.
  for (let i = 0; i < Math.min(existing.length, chapters.length); i++) {
    await chapterRequest(`/api/chapters/${existing[i].id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: chapterTitle(chapters[i], i), body: chapters[i].content }),
    })
  }

  // Create the ones beyond the existing rows.
  for (let i = existing.length; i < chapters.length; i++) {
    await chapterRequest('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, title: chapterTitle(chapters[i], i), body: chapters[i].content }),
    })
  }

  // Delete the ones the editor dropped.
  for (let i = chapters.length; i < existing.length; i++) {
    await chapterRequest(`/api/chapters/${existing[i].id}`, { method: 'DELETE' })
  }

  // The shared chapter store is cached for the whole browser session, so an
  // admin who saves a book and then hits Read would otherwise open the reader
  // against the pre-save snapshot and be told the book has no content.
  await refreshReadableContent()
  await refetchResources()
}

/** Creates every chapter of a brand-new TEXT book, in typed order. */
export async function createResourceChapters(resourceId: string, chapters: FormChapter[]): Promise<void> {
  for (let i = 0; i < chapters.length; i++) {
    await chapterRequest('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, title: chapterTitle(chapters[i], i), body: chapters[i].content }),
    })
  }
  await refreshReadableContent()
  await refetchResources()
}
