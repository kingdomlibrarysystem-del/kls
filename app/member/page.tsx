import MemberWelcome from "@/app/member/_components/MemberWelcome";
import DashboardStats from "@/app/member/_components/DashboardStats";
import BorrowedBooks from "@/app/member/_components/BorrowedBooks";
import FavoriteBooks from "@/app/member/_components/FavoriteBooks";
import ELearningProgress from "@/app/member/_components/ELearningProgress";
import CurrentlyReading from "@/app/member/_components/CurrentlyReading";
import QuickActions from "@/app/member/_components/QuickActions";

export default function MemberDashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <MemberWelcome />

      <DashboardStats />

      {/* Reading takes the wide column; learning sits beside it. One column on phones. */}
      <div className="grid gap-5 lg:grid-cols-3">
        <CurrentlyReading className="lg:col-span-2" />
        <ELearningProgress />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <BorrowedBooks />
        <FavoriteBooks />
        <QuickActions className="md:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}
