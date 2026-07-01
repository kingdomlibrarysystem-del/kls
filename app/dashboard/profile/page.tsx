import { PageHeader } from '@/components/ui/page-header'
import { ProfileInfoForm } from './_components/profile-info-form'
import { PasswordChangeForm } from './_components/password-change-form'
import { AccountInfoSection } from './_components/account-info-section'
import { TwoFactorSection } from './_components/two-factor-section'
import { SessionsSection } from './_components/sessions-section'
import { LoginHistorySection } from './_components/login-history-section'

export default function ProfilePage() {
  return (
    <div>
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information"
      />

      <div className="max-w-2xl">
        <ProfileInfoForm />
        <PasswordChangeForm />
        <AccountInfoSection />

        {/* Two-factor authentication (admin/manager/staff only) */}
        <TwoFactorSection />

        {/* Sessions & devices */}
        <SessionsSection />

        {/* Login history */}
        <LoginHistorySection />
      </div>
    </div>
  )
}
