import { MainHeader } from '@/components/main-header'
import { MainFooter } from '@/components/main-footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      <main className="flex-1">{children}</main>
      <MainFooter />
    </div>
  )
}
