import BorrowReturn from "./_components/BorrowReturn";
import DashboardKpis from "./_components/DashboardKpis";
import DigitalLibrary from "./_components/DigitalLibrary";
import { FooterSection } from "./_components/FooterSection";
import InventoryOverview, { QuickActions } from "./_components/InventoryOverview";
import { PopularResources, RecentlyAdded } from "./_components/MiddleSection";
import { PublishingServices, ResearchServices } from "./_components/RightPanels";
import WelcomeSection from "./_components/WelcomeSection";
import { ArticleEngagementCard, BookEngagementCard } from "./_components/ReaderEngagement";
import { requireStaffPage } from "@/lib/server/page-session";
import { getAdminDashboardData } from "@/lib/data/admin-dashboard";
import { toPlain } from "@/lib/server/to-plain";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

/**
 * Admin home. All widget data is loaded here on the server in one batch of
 * parallel aggregate queries (lib/data/admin-dashboard.ts) and passed down —
 * no widget fetches on mount (PERFORMANCE.md rules 1-5, 15).
 *
 * Layout (one 16px rhythm everywhere, columns bottom-aligned so no gaps):
 *   hero → KPI row → [loans + KCS + research (2/3) | quick actions + publishing (1/3)]
 *   → [inventory | popular | recently added] → [article readers | book readers] → [roadmap (2/3) | AI + community (1/3)]
 */
export default async function DashboardPage() {
  await requireStaffPage();
  const data = toPlain<AdminDashboardData>(await getAdminDashboardData());

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
      <WelcomeSection inventory={data.inventory} />

      <DashboardKpis borrow={data.borrow} reservationsTotal={data.reservationsTotal} membersTotal={data.membersTotal} />

      <div className="grid items-stretch gap-4 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          <BorrowReturn borrow={data.borrow} />
          <DigitalLibrary />
          <ResearchServices projects={data.projects} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <QuickActions />
          <PublishingServices publications={data.publications} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InventoryOverview inventory={data.inventory} />
        <PopularResources popular={data.popular} />
        <RecentlyAdded recent={data.inventory.newest} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ArticleEngagementCard articles={data.engagement.articles} />
        <BookEngagementCard books={data.engagement.books} />
      </div>

      <FooterSection />
    </div>
  );
}
