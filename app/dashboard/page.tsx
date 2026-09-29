import BorrowReturn       from "./_components/BorrowReturn";
import DigitalLibrary     from "./_components/DigitalLibrary";
import { FooterSection, StatsBar } from "./_components/FooterSection";
import InventoryOverview  from "./_components/InventoryOverview";
import MiddleSection      from "./_components/MiddleSection";
import RightPanels        from "./_components/RightPanels";
import WelcomeSection     from "./_components/WelcomeSection";
import { requireStaffPage } from "@/lib/server/page-session";
import { getAdminDashboardData } from "@/lib/data/admin-dashboard";
import { toPlain } from "@/lib/server/to-plain";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

/**
 * Admin home. All widget data is loaded here on the server in one batch of
 * parallel aggregate queries (lib/data/admin-dashboard.ts) and passed down —
 * no widget fetches on mount (PERFORMANCE.md rules 1-5).
 */
export default async function DashboardPage() {
  await requireStaffPage();
  const data = toPlain<AdminDashboardData>(await getAdminDashboardData());
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ROW 1 – three columns on lg+, stacked single column below */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(180px,280px)_1fr_minmax(160px,256px)] gap-3 lg:gap-0"
        style={{ maxWidth: "100%" }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <BorrowReturn borrow={data.borrow} reservationsTotal={data.reservationsTotal} />
        </div>

        {/* CENTRE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
          <WelcomeSection inventory={data.inventory} />
          <DigitalLibrary />
          <InventoryOverview inventory={data.inventory} />
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RightPanels publications={data.publications} projects={data.projects} />
        </div>
      </div>

      {/* ROW 2 */}
      <MiddleSection popular={data.popular} recent={data.inventory.newest} />

      {/* ROW 3 */}
      <StatsBar membersTotal={data.membersTotal} borrowTotal={data.borrow.total} />

      {/* ROW 4 */}
      <FooterSection />

    </div>
  );
}
