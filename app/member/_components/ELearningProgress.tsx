"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useCourses } from "@/app/member/_shared/use-courses";
import { useEnrollments, getProgressPercent } from "@/app/member/_shared/use-enrollments";
import { DashboardCard, DashboardEmpty } from "./dashboard-card";

/**
 * Dashboard-home widget showing real per-course progress from the real
 * /api/enrollments: an overall progress ring, then each course (most
 * advanced first) with its own bar, linking to the course.
 */
export default function ELearningProgress({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { data: enrollments } = useEnrollments();
  const { data: courseCatalog } = useCourses();

  const rows = enrollments
    .map((e) => ({ enrollment: e, course: courseCatalog.find((c) => c.id === e.courseId) }))
    .filter((r): r is { enrollment: typeof enrollments[number]; course: NonNullable<typeof r.course> } => !!r.course)
    .map((r) => ({ ...r, percent: getProgressPercent(r.enrollment) }))
    .sort((a, b) => b.percent - a.percent);

  const totalProgress = rows.length ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / rows.length) : 0;

  return (
    <DashboardCard
      className={className}
      icon={<GraduationCap className="size-5" />}
      iconClass="bg-[#2a5f8f]/15 text-[#12304a] dark:text-sky-300"
      title={t("m_ewidget.title")}
      footerHref="/member/courses"
      footerLabel={t("m_ewidget.view_all")}
    >
      {rows.length === 0 ? (
        <DashboardEmpty icon={<GraduationCap className="size-7" />} text={t("m_ewidget.not_enrolled")} href="/member/e-learning" linkLabel={t("m_ewidget.explore_courses")} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-[#1a3d5c] to-[#0b2136] p-4 text-[#f6efe0]">
            <ProgressRing value={totalProgress} />
            <p className="text-sm leading-snug text-[#f6efe0]/80"><span className="block font-cinzel text-base font-bold text-[#f6efe0]">{t("m_courses.overall_progress")}</span>
              {rows.length} {t("m_courses.courses_word")}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {rows.slice(0, 4).map(({ course, percent }) => (
              <li key={course.id}>
                <Link href={`/member/courses/${course.id}`} className="group block">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-card-foreground group-hover:text-[#12304a] dark:group-hover:text-primary">{course.title}</span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{percent}%</span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-[#2a5f8f] dark:bg-sky-400" style={{ width: `${percent}%` }} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardCard>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex size-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} />
      </svg>
      <span className="text-sm font-bold tabular-nums">{value}%</span>
    </span>
  );
}
