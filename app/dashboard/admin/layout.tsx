import { Sidebar } from './_components/sidebar'
import { DashboardTopbar } from './_components/topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Right column: topbar + content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
