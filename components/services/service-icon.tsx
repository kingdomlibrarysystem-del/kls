import { Sparkles } from 'lucide-react'
import { SERVICE_ICONS } from '@/lib/services/shared'

/** The icon chosen for a programme / life area (key from SERVICE_ICONS; Sparkles when unknown). */
export function ServiceIcon({ name, className, size }: { name: string; className?: string; size?: number }) {
  const Icon = SERVICE_ICONS[name]?.Icon ?? Sparkles
  return <Icon className={className} size={size} aria-hidden />
}
