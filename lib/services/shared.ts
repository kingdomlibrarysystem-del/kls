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
  keyServices: string[]
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

/** solid = header band / button; soft = tinted chip; text = accent text; ring = outline. Each works in light and dark mode. */
export const SERVICE_COLORS: Record<string, { label: string; solid: string; soft: string; text: string; ring: string }> = {
  blue: { label: 'Blue', solid: 'bg-blue-700 text-white', soft: 'bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-700/40' },
  gold: { label: 'Gold', solid: 'bg-amber-600 text-white', soft: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-600/40' },
  green: { label: 'Green', solid: 'bg-emerald-700 text-white', soft: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-700/40' },
  purple: { label: 'Purple', solid: 'bg-purple-700 text-white', soft: 'bg-purple-50 text-purple-800 dark:bg-purple-500/15 dark:text-purple-200', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-700/40' },
  red: { label: 'Red', solid: 'bg-red-600 text-white', soft: 'bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200', text: 'text-red-700 dark:text-red-300', ring: 'ring-red-600/40' },
  teal: { label: 'Teal', solid: 'bg-teal-700 text-white', soft: 'bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200', text: 'text-teal-700 dark:text-teal-300', ring: 'ring-teal-700/40' },
  orange: { label: 'Orange', solid: 'bg-orange-600 text-white', soft: 'bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-600/40' },
  navy: { label: 'Navy', solid: 'bg-slate-800 text-white', soft: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200', text: 'text-slate-800 dark:text-slate-200', ring: 'ring-slate-800/40' },
}

export function serviceColor(key: string) {
  return SERVICE_COLORS[key] ?? SERVICE_COLORS.gold
}

export function slugify(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}
