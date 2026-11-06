import {
  Brain, BookOpen, Cog, GraduationCap, HandHeart, HeartHandshake, HeartPulse, Leaf, Link2Off, MessagesSquare,
  PersonStanding, ShieldCheck, Sparkles, Sprout, TreeDeciduous, UsersRound, type LucideIcon,
} from 'lucide-react'

/**
 * Client-safe types and the presentation options for service programmes and
 * life areas. The programmes themselves are admin data (ServiceProgram /
 * LifeArea tables); only the icon set and colour set are fixed here, like any
 * other design token — Tailwind needs the class names written out.
 */
export interface ServiceProgramItem {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  image: string | null
  icon: string
  color: string
  /** Legacy text list — emptied once its entries become sub-services (offerings). */
  keyServices: string[]
  /** Sub-services: visible ones on public pages, all of them on the admin page. */
  offerings: ServiceOfferingItem[]
  ctaLabel: string | null
  ctaHref: string | null
  sortOrder: number
  active: boolean
}

export interface LifeAreaItem {
  id: string
  name: string
  description: string
  icon: string
  color: string
  sortOrder: number
  active: boolean
}

/** What the header menu needs (small, cached). */
export type ServiceNavItem = Pick<ServiceProgramItem, 'slug' | 'name' | 'tagline' | 'icon' | 'color'>

export const SERVICE_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  'heart-pulse': { label: 'Heart pulse', Icon: HeartPulse },
  sparkles: { label: 'Sparkles', Icon: Sparkles },
  messages: { label: 'Conversation', Icon: MessagesSquare },
  'person-standing': { label: 'Person', Icon: PersonStanding },
  tree: { label: 'Tree', Icon: TreeDeciduous },
  cog: { label: 'Gear', Icon: Cog },
  'link-off': { label: 'Broken link', Icon: Link2Off },
  'heart-handshake': { label: 'Heart handshake', Icon: HeartHandshake },
  users: { label: 'People', Icon: UsersRound },
  'hand-heart': { label: 'Hand heart', Icon: HandHeart },
  book: { label: 'Book', Icon: BookOpen },
  graduation: { label: 'Graduation cap', Icon: GraduationCap },
  leaf: { label: 'Leaf', Icon: Leaf },
  sprout: { label: 'Sprout', Icon: Sprout },
  brain: { label: 'Brain', Icon: Brain },
  shield: { label: 'Shield', Icon: ShieldCheck },
}

export function serviceIcon(key: string): LucideIcon {
  return SERVICE_ICONS[key]?.Icon ?? Sparkles
}

/**
 * The website's own colours only (app/globals.css): gold (primary #d4a843),
 * deep gold (#a07830), espresso (w-950 #2c2416) and ink (#1a1a2e, the text
 * navy). solid = header band / icon disc; soft = tinted chip; text = accent
 * text; ring = hover outline. Each works in light and dark mode.
 */
export const SERVICE_COLORS: Record<string, { label: string; solid: string; soft: string; text: string; ring: string }> = {
  gold: {
    label: 'Gold',
    solid: 'bg-primary text-primary-foreground',
    soft: 'bg-primary/10 text-w-900 dark:bg-primary/15 dark:text-primary',
    text: 'text-w-700 dark:text-primary',
    ring: 'ring-primary/50',
  },
  bronze: {
    label: 'Deep gold',
    solid: 'bg-[#a07830] text-white',
    soft: 'bg-w-100 text-w-900 dark:bg-[#a07830]/20 dark:text-w-200',
    text: 'text-[#8a6628] dark:text-w-300',
    ring: 'ring-[#a07830]/50',
  },
  espresso: {
    label: 'Espresso',
    solid: 'bg-w-950 text-w-100 dark:bg-w-900',
    soft: 'bg-w-200/60 text-w-950 dark:bg-white/10 dark:text-w-100',
    text: 'text-w-950 dark:text-w-200',
    ring: 'ring-w-950/40',
  },
  ink: {
    label: 'Ink navy',
    solid: 'bg-[#1a1a2e] text-[#f0c96a] dark:bg-[#161e30]',
    soft: 'bg-[#1a1a2e]/[0.06] text-[#1a1a2e] dark:bg-white/10 dark:text-[#f0f2f8]',
    text: 'text-[#1a1a2e] dark:text-[#f0c96a]',
    ring: 'ring-[#1a1a2e]/40',
  },
}

/**
 * Colour keys saved before the palette was limited to the site colours —
 * shown in the nearest brand colour, so old records need no data change.
 */
const LEGACY_COLORS: Record<string, string> = {
  blue: 'ink', navy: 'ink', purple: 'bronze',
  green: 'espresso', teal: 'espresso',
  red: 'bronze', orange: 'bronze',
}

export function serviceColor(key: string) {
  return SERVICE_COLORS[key] ?? SERVICE_COLORS[LEGACY_COLORS[key] ?? 'gold']
}

/** The saved key as one of the current colours (for the admin picker). */
export function normalizeColorKey(key: string): string {
  return key in SERVICE_COLORS ? key : LEGACY_COLORS[key] ?? 'gold'
}

// ─── Sub-services and requests ───────────────────────────────────────────────

export type ServiceChannelCode = 'CALL' | 'MESSAGE' | 'MEETING'
export const SERVICE_CHANNEL_CODES: readonly ServiceChannelCode[] = ['CALL', 'MESSAGE', 'MEETING']

export interface ServiceOfferingItem {
  id: string
  programId: string
  slug: string
  name: string
  summary: string
  description: string | null
  image: string | null
  channels: ServiceChannelCode[]
  productIds: string[]
  priceNote: string | null
  sortOrder: number
  active: boolean
}

export type ServiceRequestStatusCode = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface ServiceRequestItem {
  id: string
  number: string
  userId: string
  userName: string | null
  userEmail: string | null
  programId: string
  programName: string
  programSlug: string | null
  offeringIds: string[]
  offeringNames: string[]
  channel: ServiceChannelCode
  preferredAt: string | null
  phone: string | null
  note: string
  status: ServiceRequestStatusCode
  scheduledAt: string | null
  meetingLink: string | null
  staffNote: string | null
  cancelReason: string | null
  handledById: string | null
  createdAt: string
}

export function slugify(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}
