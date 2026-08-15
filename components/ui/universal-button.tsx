'use client'

import { forwardRef } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type UniversalButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold' | 'gold-outline' | 'dim-outline'
type UniversalButtonSize = 'sm' | 'md' | 'lg' | 'icon'

// "gold"/"gold-outline"/"dim-outline" reuse this project's existing
// dashboard/member CSS-variable dialect classes (.btn/.btn-gold/
// .btn-outline/.btn-outline-dim, defined in globals.css) directly,
// rather than duplicating their colors here — the other variants use
// the Tailwind w-* scale already used by ElegantButton/public pages.
const VARIANT_CLASSES: Record<UniversalButtonVariant, string> = {
  primary: 'bg-w-600 text-white hover:bg-w-700 active:bg-w-800 border border-w-700',
  secondary: 'bg-w-400 text-w-950 hover:bg-w-500 active:bg-w-600 border border-w-500',
  outline: 'bg-transparent text-w-600 hover:bg-w-50 active:bg-w-100 border border-w-600',
  ghost: 'bg-transparent text-w-700 hover:bg-w-100 border border-transparent',
  destructive: 'bg-red-600 text-white hover:bg-red-700 border border-red-700',
  gold: 'btn btn-gold',
  'gold-outline': 'btn btn-outline',
  'dim-outline': 'btn btn-outline-dim',
}

// The CSS-dialect variants (gold/gold-outline/dim-outline) bring their
// own sizing via the .btn/.btn-sm classes, so the Tailwind size utility
// classes are only applied for the Tailwind-dialect variants.
const CSS_DIALECT_VARIANTS = new Set<UniversalButtonVariant>(['gold', 'gold-outline', 'dim-outline'])

const SIZE_CLASSES: Record<UniversalButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
  icon: 'p-2',
}

const CSS_DIALECT_SIZE_CLASSES: Partial<Record<UniversalButtonSize, string>> = {
  sm: 'btn-sm',
}

const BASE_CLASSES = 'kcs-universal-btn inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none'
const TAILWIND_BASE_CLASSES = 'gap-2 rounded font-lato font-normal transition-all duration-200 ease-in-out'

interface CommonProps {
  variant?: UniversalButtonVariant
  size?: UniversalButtonSize
  fullWidth?: boolean
  className?: string
  children?: React.ReactNode
  /** Icon shown before the label — hidden and replaced by the spinner while loading/redirecting. */
  icon?: React.ReactNode
}

interface ButtonAsButtonProps extends CommonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  href?: undefined
  /** True while an async action (e.g. a form submit or fetch) triggered by this button is in flight. */
  loading?: boolean
}

interface ButtonAsLinkProps extends CommonProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'> {
  /** Navigates here on click — renders as a real Link (preserves prefetch, right-click/open-in-new-tab) with an automatic "redirecting" spinner while the target route is pending. */
  href: string
  loading?: undefined
  /** next/link's prefetch prop, passed through. */
  prefetch?: boolean
}

export type UniversalButtonProps = ButtonAsButtonProps | ButtonAsLinkProps

function ButtonInner({ loading, icon, children }: { loading: boolean; icon?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </>
  )
}

/** Reads next/link's pending-navigation state — only valid as a descendant of the Link this button renders. */
function LinkSpinnerContent({ icon, children }: { icon?: React.ReactNode; children?: React.ReactNode }) {
  const { pending } = useLinkStatus()
  return <ButtonInner loading={pending} icon={icon}>{children}</ButtonInner>
}

/**
 * Single button primitive meant to replace ElegantButton, the Base UI
 * Button, and ad hoc `<button className="btn btn-gold">`/`<Link
 * className="btn ...">` usages across the app. Two modes, chosen by
 * whether `href` is passed:
 *
 * - No `href`: renders a real <button>. Pass `loading` explicitly (e.g.
 *   while a fetch/mutation is in flight) to disable it and show a spinner
 *   in place of its icon.
 * - `href` given: renders a real next/link Link (so prefetch, keyboard
 *   nav, and open-in-new-tab all keep working — this is NOT a
 *   router.push-in-a-button-onClick fake link). Automatically shows a
 *   spinner via useLinkStatus() while the target route is still loading,
 *   without the caller needing to track any state — this is what every
 *   "View" action migrated off a details modal should use.
 *
 * `variant="gold" | "gold-outline" | "dim-outline"` map onto this
 * project's dashboard/member CSS-variable dialect (.btn-gold etc. in
 * globals.css) via the kcs-btn-* class names defined alongside this
 * component; the other variants use the Tailwind w-* scale already used
 * by ElegantButton for public/forms pages. Never introduces a new color.
 */
export const UniversalButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, UniversalButtonProps>(function UniversalButton(
  { variant = 'primary', size = 'md', fullWidth = false, className = '', icon, children, ...props },
  ref
) {
  const isCssDialect = CSS_DIALECT_VARIANTS.has(variant)
  const classes = cn(
    BASE_CLASSES,
    !isCssDialect && TAILWIND_BASE_CLASSES,
    VARIANT_CLASSES[variant],
    isCssDialect ? CSS_DIALECT_SIZE_CLASSES[size] : SIZE_CLASSES[size],
    fullWidth && 'w-full',
    className
  )

  if ('href' in props && props.href !== undefined) {
    const { href, prefetch, ...anchorProps } = props as ButtonAsLinkProps
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        prefetch={prefetch}
        className={classes}
        {...anchorProps}
      >
        <LinkSpinnerContent icon={icon}>{children}</LinkSpinnerContent>
      </Link>
    )
  }

  const { loading = false, disabled, ...buttonProps } = props as ButtonAsButtonProps
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={disabled || loading}
      aria-busy={loading}
      className={classes}
      {...buttonProps}
    >
      <ButtonInner loading={loading} icon={icon}>{children}</ButtonInner>
    </button>
  )
})
