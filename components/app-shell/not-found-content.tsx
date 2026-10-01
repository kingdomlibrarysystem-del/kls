import Link from 'next/link'
import { BookX, Home, Library, Newspaper } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NotFoundAction {
  href: string
  label: string
  icon: React.ReactNode
}

interface NotFoundContentProps {
  /** 'page' = full screen (site-wide 404); 'portal' = inside the dashboard/member layout. */
  variant?: 'page' | 'portal'
  title?: string
  description?: string
  primary?: NotFoundAction
  secondary?: NotFoundAction[]
}

/**
 * The one "not found" design for the whole app — replaces Next's default
 * "404 | This page could not be found." Used by app/not-found.tsx (site-wide)
 * and PortalNotFound (dashboard + member layouts). Theme tokens, so it works
 * in light and dark mode.
 */
export function NotFoundContent({
  variant = 'page',
  title = 'Page not found',
  description = "The page you're looking for doesn't exist, was moved, or you don't have access to it.",
  primary = { href: '/', label: 'Back to home', icon: <Home /> },
  secondary = [
    { href: '/library', label: 'Browse the library', icon: <Library /> },
    { href: '/news', label: 'Latest news', icon: <Newspaper /> },
  ],
}: NotFoundContentProps) {
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden px-4', variant === 'page' ? 'min-h-screen bg-background py-16' : 'min-h-[65vh] py-10')}>
      {/* Soft gold glow behind the card */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-lg text-center">
        <p aria-hidden className="select-none font-cinzel text-[96px] font-bold leading-none tracking-widest text-primary/20 sm:text-[128px]">404</p>
        <div className="mx-auto -mt-10 flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-card text-primary shadow-sm sm:-mt-14">
          <BookX className="size-8" />
        </div>

        <h1 className="mt-6 font-cinzel text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={primary.href} className={cn(buttonVariants(), 'h-10 px-5 font-semibold')}>
            {primary.icon} {primary.label}
          </Link>
          {secondary.map((a) => (
            <Link key={a.href} href={a.href} className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-5')}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>

        {variant === 'page' && (
          <p className="mt-10 text-xs tracking-[0.2em] text-muted-foreground">KINGDOM LIBRARY · KCS SYSTEM</p>
        )}
      </div>
    </div>
  )
}

