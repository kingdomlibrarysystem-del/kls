import { MessageSquare, Phone, Video } from 'lucide-react'
import type { ServiceChannelCode } from '@/lib/services/shared'

const ICONS = { CALL: Phone, MESSAGE: MessageSquare, MEETING: Video } as const

/** Icon for a way of getting help: phone call, messages or online meeting. */
export function ChannelIcon({ channel, className }: { channel: ServiceChannelCode; className?: string }) {
  const Icon = ICONS[channel]
  return <Icon className={className} aria-hidden />
}
