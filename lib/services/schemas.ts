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
  keyServices: z.array(z.string().trim().min(2).max(120)).max(12, 'At most 12 key services').optional(),
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

const channel = z.enum(['CALL', 'MESSAGE', 'MEETING'])

export const offeringSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes').max(60).optional(),
  summary: z.string().trim().min(2, 'Write a short summary').max(240),
  description: z.string().trim().max(4000).nullable().optional(),
  image: z.string().trim().url('Image must be a link').max(500).nullable().optional().or(z.literal('')),
  channels: z.array(channel).min(1, 'Choose at least one way to help (call, messages or meeting)'),
  productIds: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(24, 'Link at most 24 products'),
  priceNote: z.string().trim().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
})

export const requestSchema = z.object({
  programId: z.string().regex(/^[a-f0-9]{24}$/i, 'Choose a service'),
  offeringIds: z.array(z.string()).min(1, 'Choose at least one sub-service').max(20),
  channel,
  /** ISO date-time; optional. */
  preferredAt: z.string().datetime({ offset: true }).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional()
    .refine((v) => !v || /^(\+?25)?0?7[2389]\d{7}$/.test(v.replace(/[\s-]/g, '')), 'Enter a valid Rwandan phone number, e.g. 078 123 4567'),
  note: z.string().trim().min(5, 'Tell us briefly what you need').max(2000),
})

export const requestActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('schedule'),
    scheduledAt: z.string().datetime({ offset: true }),
    meetingLink: z.string().trim().url('Meeting link must start with https://').max(500).nullable().optional().or(z.literal('')),
    staffNote: z.string().trim().max(1000).nullable().optional(),
  }),
  z.object({ action: z.literal('complete'), staffNote: z.string().trim().max(1000).nullable().optional() }),
  z.object({ action: z.literal('cancel'), reason: z.string().trim().min(3, 'Give a short reason').max(500) }),
])
