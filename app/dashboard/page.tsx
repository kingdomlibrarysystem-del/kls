import BorrowReturn       from "./_components/BorrowReturn";
import ConsultationPanel  from "./_components/ConsultationPanel";
import DigitalLibrary     from "./_components/DigitalLibrary";
import { FooterSection, StatsBar } from "./_components/FooterSection";
import InventoryOverview  from "./_components/InventoryOverview";
import MiddleSection      from "./_components/MiddleSection";
import RightPanels        from "./_components/RightPanels";
import WelcomeSection     from "./_components/WelcomeSection";

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ROW 1 – three columns on lg+, stacked single column below */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(180px,280px)_1fr_minmax(160px,256px)] gap-3 lg:gap-0"
        style={{ maxWidth: "100%" }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <BorrowReturn />
          <ConsultationPanel />
        </div>

        {/* CENTRE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
          <WelcomeSection />
          <DigitalLibrary />
          <InventoryOverview />
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RightPanels />
        </div>
      </div>

      {/* ROW 2 */}
      <MiddleSection />

      {/* ROW 3 */}
      <StatsBar />

      {/* ROW 4 */}
      <FooterSection />

    </div>
  );
}
