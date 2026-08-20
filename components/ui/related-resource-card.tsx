import Image from 'next/image'
import { BookMarked, Film, Package, BookOpen } from 'lucide-react'
import type { Resource, BindingType, MediaType } from '@/app/dashboard/library/_components/resources-data'
import { bindingTypeLabels, mediaTypeLabels } from '@/app/dashboard/library/_components/resources-data'

interface RelatedResourceCardProps {
  resource: Resource
  /** Rendered below the resource's own fields — typically a real "Borrow this resource" action. */
  action?: React.ReactNode
  /** Tailwind utility classes for the card in Dialect A contexts. */
  className?: string
  /** Inline style overrides for the card in Dialect B contexts. */
  style?: React.CSSProperties
}

/**
 * A single canonical library Resource shown as a "related resource" for a
 * KCS scroll — binding type, media type, price, and real availability.
 * Dialect-flexible like EmptyState/Skeleton: pass `className` (Dialect A)
 * or `style` (Dialect B). Shared by the admin KCS scroll detail page and
 * the member Kingdom Library scroll detail page so both render the same
 * real resource data the same way.
 */
export function RelatedResourceCard({ resource, action, className, style }: RelatedResourceCardProps) {
  const isDialectB = !!style
  const outOfStock = resource.availableQty === 0

  const chip = (label: string, icon: React.ReactNode) =>
    isDialectB ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-section)', padding: '2px 6px', borderRadius: 3 }}>
        {icon} {label}
      </span>
    ) : (
      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">
        {icon} {label}
      </span>
    )

  const cover = resource.coverImages?.[0]

  return (
    <div
      className={isDialectB ? '' : `card ${className ?? ''}`}
      style={isDialectB ? { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, ...style } : undefined}
    >
      <div style={{ position: 'relative', height: isDialectB ? 160 : undefined, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-section, #f0ece4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className={isDialectB ? '' : 'h-40 mb-2'}>
        {cover ? (
          <Image src={cover} alt={resource.title} fill sizes="240px" className="object-cover" />
        ) : (
          <BookOpen size={28} color="var(--gold, #b8860b)" />
        )}
      </div>
      <p className={isDialectB ? '' : 'font-cinzel text-sm font-semibold text-w-950'} style={isDialectB ? { fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' } : undefined}>
        {resource.title}
      </p>
      <p className={isDialectB ? '' : 'font-lato text-xs text-w-700'} style={isDialectB ? { fontSize: 10, color: 'var(--text-muted)' } : undefined}>
        by {resource.author} · {resource.publisher}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {chip(bindingTypeLabels[resource.bindingType as BindingType], <BookMarked size={10} />)}
        {chip(mediaTypeLabels[resource.mediaType as MediaType], <Film size={10} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={isDialectB ? '' : 'font-cinzel text-sm font-bold text-w-600'} style={isDialectB ? { fontSize: 13, fontWeight: 700, color: 'var(--gold)' } : undefined}>
          {resource.price.toLocaleString()} RWF
        </span>
        <span
          className={isDialectB ? '' : `flex items-center gap-1 text-xs font-lato ${outOfStock ? 'text-red-700' : 'text-w-700'}`}
          style={isDialectB ? { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: outOfStock ? 'var(--red-light)' : 'var(--text-secondary)' } : undefined}
        >
          <Package size={11} /> {resource.availableQty} available
        </span>
      </div>
      {action}
    </div>
  )
}
