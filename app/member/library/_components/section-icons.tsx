import type { ReactNode } from 'react'
import { ScrollText, History, Lightbulb, Radio, Heart, Rocket, BookCopy, Eye } from 'lucide-react'

/**
 * Presentational icon-per-root-pillar mapping — the one member-specific
 * bit that doesn't belong on the canonical `Category` (a data model has no
 * business holding a `ReactNode`). Everything else `library-data.tsx` used
 * to hand-retype (section labels/descriptions/book lists) now comes
 * straight from `lib/kcs-taxonomy`, confirmed to have no unique content of
 * its own once folded in.
 */
export const sectionIcons: Record<string, ReactNode> = {
  'kcs-fnd': <ScrollText size={16} />,
  'kcs-his': <History size={16} />,
  'kcs-wis': <Lightbulb size={16} />,
  'kcs-prp': <Radio size={16} />,
  'kcs-gos': <Heart size={16} />,
  'kcs-act': <Rocket size={16} />,
  'kcs-epi': <BookCopy size={16} />,
  'kcs-rev': <Eye size={16} />,
}
