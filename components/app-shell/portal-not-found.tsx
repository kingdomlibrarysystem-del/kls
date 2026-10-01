import { ArrowLeft, Newspaper, Library } from 'lucide-react'
import { NotFoundContent } from './not-found-content'

/** In-portal 404 for server pages that call notFound() (missing record, bad id, or a record the viewer may not see). Same design as the site-wide 404. */
export function PortalNotFound({ homeHref, homeLabel }: { homeHref: string; homeLabel: string }) {
  const inAdmin = homeHref.startsWith('/dashboard')
  return (
    <NotFoundContent
      variant="portal"
      title="Not found"
      description="This record doesn't exist, was removed, or you don't have access to it."
      primary={{ href: homeHref, label: homeLabel, icon: <ArrowLeft /> }}
      secondary={
        inAdmin
          ? [{ href: '/dashboard/library', label: 'Book Inventory', icon: <Library /> }]
          : [
              { href: '/member/library', label: 'Kingdom Library', icon: <Library /> },
              { href: '/member/news', label: 'News', icon: <Newspaper /> },
            ]
      }
    />
  )
}
