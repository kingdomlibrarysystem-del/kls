import MemberWelcome from "@/app/member/_components/MemberWelcome";
import BorrowedBooks from "@/app/member/_components/BorrowedBooks";
import FavoriteBooks from "@/app/member/_components/FavoriteBooks";
import ELearningProgress from "@/app/member/_components/ELearningProgress";
import QuickActions from "@/app/member/_components/QuickActions";
import { BookOpen, Heart, GraduationCap, Award, Star, CreditCard } from "lucide-react";

const stats = [
  { icon: <BookOpen size={18} />, label: "Books Read", value: "12", color: "var(--gold)", bg: "rgba(212,168,67,0.1)" },
  { icon: <Heart size={18} />, label: "Books Liked", value: "8", color: "var(--red-light)", bg: "rgba(239,68,68,0.1)" },
  { icon: <GraduationCap size={18} />, label: "E-Learning Progress", value: "42%", color: "var(--teal-light)", bg: "rgba(45,212,191,0.1)" },
  { icon: <Award size={18} />, label: "Certificates", value: "3", color: "var(--purple-light)", bg: "rgba(168,85,247,0.1)" },
  { icon: <Star size={18} />, label: "Avg Assessment Score", value: "72%", color: "var(--gold)", bg: "rgba(212,168,67,0.1)" },
  { icon: <CreditCard size={18} />, label: "Payments", value: "Premium", color: "var(--green-light)", bg: "rgba(34,197,94,0.1)" },
];

export default function MemberDashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <MemberWelcome />

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {stats.slice(0, 3).map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {stats.slice(3).map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <BorrowedBooks />
        <FavoriteBooks />
        <ELearningProgress />
      </div>
      <QuickActions />
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
        <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{label}</div>
      </div>
    </div>
  );
}
