import { AppTopbar } from "@/components/app-shell/app-topbar";
import ContributorSidebar from "./_components/contributor-sidebar";
import ContributorMobileBottomNav from "./_components/contributor-mobile-bottom-nav";

export default function ContributorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar portalLabel="Contributor Workspace" profileHref="/contributor" notificationCount={1} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <ContributorSidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4" style={{ background: 'var(--bg-dashboard)' }}>
          {children}
        </main>
      </div>
      <ContributorMobileBottomNav />
    </div>
  );
}
