import { SearchX, ArrowLeft } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'

/** In-portal 404 for server pages that call notFound() (missing record, bad id, or a record the viewer may not see). */
export function PortalNotFound({ homeHref, homeLabel }: { homeHref: string; homeLabel: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={SearchX}
        title="Not found"
        description="This record doesn't exist, was removed, or you don't have access to it."
        action={
          <UniversalButton href={homeHref} variant="outline" size="sm" icon={<ArrowLeft size={14} />}>
            {homeLabel}
          </UniversalButton>
        }
      />
    </div>
  )
}
