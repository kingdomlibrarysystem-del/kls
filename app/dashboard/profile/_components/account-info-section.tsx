import { SectionHeader } from '@/components/ui/section-header'
import { ElegantButton } from '@/components/ui/elegant-button'

/** Static "Account Information" block, extracted verbatim from the original page.tsx (no behavior changes). */
export function AccountInfoSection() {
  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <SectionHeader>Account Information</SectionHeader>
      <div className="space-y-4 font-lato text-sm text-w-700">
        <div className="flex justify-between">
          <span>Account Created:</span>
          <span className="font-semibold text-w-950">2024-01-15</span>
        </div>
        <div className="flex justify-between">
          <span>Account Status:</span>
          <span className="font-semibold text-green-700">Active</span>
        </div>
        <div className="flex justify-between">
          <span>Email Verified:</span>
          <span className="font-semibold text-green-700">Yes</span>
        </div>
        <div className="border-t border-w-400 pt-4 mt-4">
          <p className="text-xs text-w-600 mb-3">
            For security concerns or to permanently delete your account,
            please contact our support team.
          </p>
          <ElegantButton variant="outline">Contact Support</ElegantButton>
        </div>
      </div>
    </div>
  )
}
