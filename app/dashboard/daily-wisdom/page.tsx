import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage } from '@/lib/server/page-session'
import { getAllVerses } from '@/lib/data/daily-wisdom'
import { toPlain } from '@/lib/server/to-plain'
import type { DailyVerseItem } from '@/lib/daily-wisdom-shared'
import { DailyWisdomView } from './_components/daily-wisdom-view'

/** Staff management of the header's Daily Wisdom verse. Loaded server-side (PERFORMANCE.md Rule 15). */
export default async function DailyWisdomPage() {
  await requireStaffPage()
  const verses = await getAllVerses()
  return (
    <div>
      <PageHeader title="Daily Wisdom" subtitle="Send the verse of the day, or let the automatic rotation choose one" />
      <DailyWisdomView initialVerses={toPlain<DailyVerseItem[]>(verses)} />
    </div>
  )
}
