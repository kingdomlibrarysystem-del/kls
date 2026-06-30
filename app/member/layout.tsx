import { AuthProvider } from "@/contexts/auth-context";
import { MainHeader } from "@/components/main-header";
import MemberSidebar from "./_components/member-sidebar";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <MainHeader />
        <div className="flex flex-1 overflow-hidden">
          <MemberSidebar />
          <main className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--bg-dashboard)' }}>
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
