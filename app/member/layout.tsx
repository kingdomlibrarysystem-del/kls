import { AppTopbar } from "@/components/app-shell/app-topbar";
import MemberMobileBottomNav from "./_components/mobile-bottom-nav";
import { MemberMobileMenu } from "./_components/mobile-menu";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppTopbar portalLabel="Member Portal" profileHref="/member/profile" showCart menu={<MemberMobileMenu />} />
      {/* The sidebar is hidden by default on every screen; the ☰ button in the topbar opens it (mobile-menu.tsx). */}
      <div className="flex flex-1 overflow-hidden">
        <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-16 md:pb-4" style={{ background: 'var(--bg-dashboard)' }}>
          {children}
        </main>
      </div>
      <MemberMobileBottomNav />
    </div>
  );
}
