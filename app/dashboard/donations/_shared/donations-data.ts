/**
 * Donations types — real DonationCampaign/Donation data comes from
 * /api/donations/* (see use-campaigns.ts/use-donations-admin.ts).
 * Reuses the existing OrderStatus/PaymentMethod payment lifecycle
 * verbatim, rather than inventing a new one.
 */

export type CampaignStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type DonationStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export interface DonationCampaign {
  id: string
  title: string
  description: string
  coverImage?: string | null
  category: string
  goalRwf: number
  raisedRwf: number
  status: CampaignStatus
  startDate: string
  endDate?: string | null
  featured: boolean
  createdById: string
}

export interface Donation {
  id: string
  userId: string
  donorName: string
  donorEmail?: string
  campaignId?: string | null
  resourceId?: string | null
  message?: string | null
  isAnonymous?: boolean
  method?: string
  amountRwf: number
  status: DonationStatus
  paidAt?: string | null
  createdAt: string
}

export const campaignStatusConfig: Record<CampaignStatus, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-50  text-green-800  border-green-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100      text-w-800      border-w-300' },
  ARCHIVED:  { label: 'Archived',  cls: 'bg-red-50    text-red-800    border-red-200' },
}

export const donationStatusConfig: Record<DonationStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  paid:      { label: 'Paid',      cls: 'bg-green-50  text-green-800  border-green-200' },
  failed:    { label: 'Failed',    cls: 'bg-red-50    text-red-800    border-red-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-w-100      text-w-800      border-w-300' },
}
