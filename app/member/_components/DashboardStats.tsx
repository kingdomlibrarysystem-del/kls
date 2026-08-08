"use client";

import { BookOpen, Heart, GraduationCap, Award, Star, CreditCard } from "lucide-react";
import { useBorrowings } from "@/app/member/_shared/use-borrowings";
import { useFavorites } from "@/app/member/_shared/use-favorites";
import { useEnrollments, getProgressPercent } from "@/app/member/_shared/use-enrollments";
import { useAssessmentAttempts } from "@/app/member/_shared/use-assessment-attempts";
import { useCertificates } from "@/app/dashboard/e-learning/certificates/_components/use-certificates";

/** This mock has a single member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const MEMBER_NAME = "John Doe";

/**
 * Dashboard-home stat grid, derived from the same real shared stores the
 * rest of the member portal already reads — Books Read/E-Learning
 * Progress/Certificates/Avg Assessment Score are no longer hardcoded
 * literals. "Payments" has no real data model anywhere in this app
 * (no subscription/billing store exists), so it's left as a static label
 * rather than fabricating a number — flagged here, not silently invented.
 */
export default function DashboardStats() {
  const { data: borrowings } = useBorrowings();
  const favorites = useFavorites();
  const enrollments = useEnrollments();
  const attempts = useAssessmentAttempts();
  const certificates = useCertificates();

  const booksRead = borrowings.filter((b) => b.status === "returned").length;
  const booksLiked = favorites.length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + getProgressPercent(e), 0) / enrollments.length)
    : 0;
  const memberCertificates = certificates.filter((c) => c.member === MEMBER_NAME && !c.revoked).length;
  const decidedAttempts = attempts.filter((a) => a.reviewStatus !== "PENDING_REVIEW");
  const avgScore = decidedAttempts.length
    ? Math.round(decidedAttempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / decidedAttempts.length)
    : 0;

  const stats = [
    { icon: <BookOpen size={18} />, label: "Books Read", value: String(booksRead), color: "var(--gold)", bg: "rgba(212,168,67,0.1)" },
    { icon: <Heart size={18} />, label: "Books Liked", value: String(booksLiked), color: "var(--red-light)", bg: "rgba(239,68,68,0.1)" },
    { icon: <GraduationCap size={18} />, label: "E-Learning Progress", value: `${avgProgress}%`, color: "var(--teal-light)", bg: "rgba(45,212,191,0.1)" },
    { icon: <Award size={18} />, label: "Certificates", value: String(memberCertificates), color: "var(--purple-light)", bg: "rgba(168,85,247,0.1)" },
    { icon: <Star size={18} />, label: "Avg Assessment Score", value: `${avgScore}%`, color: "var(--gold)", bg: "rgba(212,168,67,0.1)" },
    { icon: <CreditCard size={18} />, label: "Payments", value: "Premium", color: "var(--green-light)", bg: "rgba(34,197,94,0.1)" },
  ];

  return (
    <>
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
    </>
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
