/** Per-publication revenue split, per APP_DOC Task 5.4 / Prisma `RevenueShare`, `Transaction`. */
export interface RevenueRow {
  id: string
  publication: string
  contributor: string
  contributorShare: number
  platformShare: number
  totalRevenue: number
}

export const mockRevenue: RevenueRow[] = [
  { id: 'rev-001', publication: 'Walking in Covenant',       contributor: 'Pastor Emmanuel Rugamba', contributorShare: 70, platformShare: 30, totalRevenue: 245000 },
  { id: 'rev-002', publication: 'Raising Kingdom Families',    contributor: 'Dr. Alice Mutoni',         contributorShare: 65, platformShare: 35, totalRevenue: 182500 },
  { id: 'rev-003', publication: 'The Discipleship Journey',     contributor: 'Elder Samuel Byiringiro',  contributorShare: 70, platformShare: 30, totalRevenue: 96000  },
  { id: 'rev-004', publication: 'Leading with Humility',         contributor: 'Pastor Emmanuel Rugamba', contributorShare: 70, platformShare: 30, totalRevenue: 138000 },
]
