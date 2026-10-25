'use client'

import { Check } from 'lucide-react'
import { SERVICE_COLORS, SERVICE_ICONS } from '@/lib/services/shared'

/** Icon choice as a grid of buttons (keyboard and screen-reader friendly). */
export function IconPicker({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) {
  const solid = (SERVICE_COLORS[color] ?? SERVICE_COLORS.gold).solid
  return (
    <div role="radiogroup" aria-label="Icon" className="grid grid-cols-8 gap-1.5">
      {Object.entries(SERVICE_ICONS).map(([key, { label, Icon }]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} aria-label={label} title={label} onClick={() => onChange(key)}
          className={`flex aspect-square items-center justify-center rounded-lg border transition ${value === key ? `${solid} border-transparent` : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
      {Object.entries(SERVICE_COLORS).map(([key, c]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} aria-label={c.label} title={c.label} onClick={() => onChange(key)}
          className={`flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background ${c.solid} ${value === key ? 'ring-2 ring-foreground' : ''}`}>
          {value === key && <Check className="size-4" />}
        </button>
      ))}
    </div>
  )
}
