/** Per-publication revenue split, per APP_DOC Task 5.4 / Prisma `RevenueShare`, `Transaction`. */
export interface RevenueRow {
  id: string
  publication: string
  contributor: string
  contributorShare: number
  platformShare: number
  totalRevenue: number
}

