import { z } from 'zod'
import { SERVICE_COLORS, SERVICE_ICONS } from './shared'

const icon = z.string().refine((v) => v in SERVICE_ICONS, 'Choose an icon')
const color = z.string().refine((v) => v in SERVICE_COLORS, 'Choose a colour')
/** Internal path ("/shop") or a full https link. */
const href = z.string().trim().max(300).refine((v) => !v || v.startsWith('/') || /^https:\/\//.test(v), 'Use a page path like /shop or a full https:// link')

export const programSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes').max(60).optional(),
  tagline: z.string().trim().min(2, 'Tagline is required').max(120),
  description: z.string().trim().min(10, 'Write a short description').max(2000),
  image: z.string().trim().url('Image must be a link').max(500).nullable().optional().or(z.literal('')),
  icon,
  color,
  keyServices: z.array(z.string().trim().min(2).max(120)).max(12, 'At most 12 key services'),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  ctaHref: href.nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
})

export const areaSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(40),
  description: z.string().trim().min(2, 'Description is required').max(200),
  icon,
  color,
  sortOrder: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
})

/** Admin always; any other role needs this ticked at /dashboard/roles. */
export const SERVICES_PERMISSION = 'services:manage'
