"use client";

import Link from "next/link";
import { BookOpen, Heart, GraduationCap, Award, Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useBorrowings } from "@/app/member/_shared/use-borrowings";
import { useFavorites } from "@/app/member/_shared/use-favorites";
import { useEnrollments, getProgressPercent } from "@/app/member/_shared/use-enrollments";
import { useAssessmentAttempts } from "@/app/member/_shared/use-assessment-attempts";
import { useCertificates } from "@/app/member/_shared/use-certificates";

/**
 * Dashboard-home stat tiles, derived from the same real fetch hooks the
 * rest of the member portal reads. Each tile links to the page behind its
 * number. (The old "Payments: Premium" tile was a fixed label with no real
 * data behind it, so it is gone.)
 */
export default function DashboardStats() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: borrowings } = useBorrowings();
  const favorites = useFavorites(user?.id);
  const { data: enrollments } = useEnrollments();
  const { data: attempts } = useAssessmentAttempts();
  const { data: certificates } = useCertificates();

  const booksRead = borrowings.filter((b) => b.status === "returned").length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + getProgressPercent(e), 0) / enrollments.length)
    : 0;
  const memberCertificates = certificates.filter((c) => !c.revoked).length;
  const decidedAttempts = attempts.filter((a) => a.reviewStatus !== "PENDING_REVIEW");
  const avgScore = decidedAttempts.length
    ? Math.round(decidedAttempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / decidedAttempts.length)
    : 0;

  const stats = [
    { icon: BookOpen, label: t("m_stats.books_read"), value: String(booksRead), href: "/member/borrowings", tone: "bg-primary/15 text-[#a07830] dark:text-primary" },
    { icon: Heart, label: t("m_stats.books_liked"), value: String(favorites.length), href: "/member/favorites", tone: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
    { icon: GraduationCap, label: t("m_stats.elearning_progress"), value: `${avgProgress}%`, href: "/member/courses", tone: "bg-[#2a5f8f]/15 text-[#12304a] dark:text-sky-300", bar: avgProgress },
    { icon: Award, label: t("m_stats.certificates"), value: String(memberCertificates), href: "/member/certificates", tone: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
    { icon: Star, label: t("m_stats.avg_score"), value: `${avgScore}%`, href: "/member/assessments", tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400", bar: avgScore },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {stats.map(({ icon: Icon, label, value, href, tone, bar }, i) => (
        <Link
          key={label}
          href={href}
          className="kls-rise group flex flex-col gap-3 rounded-2xl last:col-span-2 sm:last:col-span-1 border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          style={{ "--kls-delay": `${0.05 * i}s` } as React.CSSProperties}
        >
          <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="size-5" />
          </span>
          <div>
            <div className="text-2xl font-bold tabular-nums text-card-foreground">{value}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
          </div>
          {bar != null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${bar}%` }} />
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
