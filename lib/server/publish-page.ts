import { getKcsCategoryOptions, getKcsPillarNames, getPublication, EDITABLE_STATUSES } from '@/lib/data/publications'
import { getMediaTypes } from '@/lib/data/media-types'
import { toPlain } from '@/lib/server/to-plain'
import type { RouteSession } from '@/lib/auth/require-role'

/**
 * Everything the book form needs (KCS categories, pillar names, media types,
 * and the book being edited), loaded in parallel on the server. Shared by
 * /publish and /member/publish. Returns null when ?edit points at a book the
 * user can't edit (not theirs, or already with the reviewers) — the page then
 * shows a 404.
 */
export async function loadBookForm(session: RouteSession, editId?: string) {
  const [categories, pillarNames, mediaTypes, editing] = await Promise.all([
    getKcsCategoryOptions(),
    getKcsPillarNames(),
    getMediaTypes(),
    editId ? getPublication(editId) : Promise.resolve(null),
  ])
  if (editId && (!editing || (editing.contributorId !== session.userId && session.role !== 'admin') || !(EDITABLE_STATUSES as readonly string[]).includes(editing.status))) {
    return null
  }
  return {
    categories: toPlain<typeof categories>(categories),
    pillarNames,
    mediaTypes: toPlain<typeof mediaTypes>(mediaTypes),
    initial: editing ? toPlain<typeof editing>(editing) : null,
  }
}
