import { AppTopbar } from "@/components/app-shell/app-topbar";
import MemberSidebar from "./_components/member-sidebar";
import MemberMobileBottomNav from "./_components/mobile-bottom-nav";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar portalLabel="Member Portal" profileHref="/member/profile" notificationCount={3} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <MemberSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4" style={{ background: 'var(--bg-dashboard)' }}>
          {children}
        </main>
      </div>
      <MemberMobileBottomNav />
    </div>
  );
}
