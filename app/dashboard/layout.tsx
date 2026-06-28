import Sidebar from "./_components/sidebar";
import DashboardTopbar from "./_components/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-root flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <DashboardTopbar />
        <main className="flex-1 p-3" style={{ background: 'var(--bg-dashboard)', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
