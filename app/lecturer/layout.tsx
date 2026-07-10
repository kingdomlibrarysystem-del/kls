import { AppTopbar } from "@/components/app-shell/app-topbar";
import LecturerSidebar from "./_components/lecturer-sidebar";
import LecturerMobileBottomNav from "./_components/lecturer-mobile-bottom-nav";

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar portalLabel="Lecturer Portal" profileHref="/lecturer" notificationCount={0} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <LecturerSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4" style={{ background: 'var(--bg-dashboard)' }}>
          {children}
        </main>
      </div>
      <LecturerMobileBottomNav />
    </div>
  );
}
