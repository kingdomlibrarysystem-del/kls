import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage } from '@/lib/server/page-session'
import { getMediaTypesWithUsage } from '@/lib/data/media-types'
import { toPlain } from '@/lib/server/to-plain'
import { MediaTypesView } from './_components/media-types-view'
import type { MediaTypeOption } from '@/lib/media-types-shared'

/** Admin management of resource media types — the list the resource form's "Media Type" field reads. Loaded server-side (PERFORMANCE.md Rule 15). */
export default async function MediaTypesPage() {
  await requireStaffPage()
  const mediaTypes = await getMediaTypesWithUsage()
  return (
    <div>
      <PageHeader title="Media Types" subtitle="The media types a library resource can be filed under, and what each one contains" />
      <MediaTypesView initialMediaTypes={toPlain<MediaTypeOption[]>(mediaTypes)} />
    </div>
  )
}
