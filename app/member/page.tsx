import MemberWelcome from "@/app/member/_components/MemberWelcome";
import DashboardStats from "@/app/member/_components/DashboardStats";
import BorrowedBooks from "@/app/member/_components/BorrowedBooks";
import FavoriteBooks from "@/app/member/_components/FavoriteBooks";
import ELearningProgress from "@/app/member/_components/ELearningProgress";
import QuickActions from "@/app/member/_components/QuickActions";

export default function MemberDashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <MemberWelcome />

      <DashboardStats />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <BorrowedBooks />
        <FavoriteBooks />
        <ELearningProgress />
      </div>
      <QuickActions />
    </div>
  );
}
