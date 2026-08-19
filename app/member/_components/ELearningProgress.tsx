"use client";

import { GraduationCap, ChevronRight, Award } from "lucide-react";
import { RankingBarChart } from "@/components/ui/ranking-bar-chart";
import { useCourses } from "@/app/member/_shared/use-courses";
import { useEnrollments, getProgressPercent } from "@/app/member/_shared/use-enrollments";

/**
 * Dashboard-home widget showing real per-course progress from the real
 * /api/enrollments (not a local mock array), rendered as a horizontal
 * ranking bar chart so multiple courses can be compared at a glance
 * instead of stacked flat progress bars.
 */
export default function ELearningProgress() {
  const { data: enrollments } = useEnrollments();
  const { data: courseCatalog } = useCourses();

  const rows = enrollments
    .map((e) => ({ enrollment: e, course: courseCatalog.find((c) => c.id === e.courseId) }))
    .filter((r): r is { enrollment: typeof enrollments[number]; course: NonNullable<typeof r.course> } => !!r.course);

  const totalProgress = rows.length
    ? Math.round(rows.reduce((s, r) => s + getProgressPercent(r.enrollment), 0) / rows.length)
    : 0;

  const chartData = rows
    .map((r) => ({ name: r.course.title, value: getProgressPercent(r.enrollment) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <GraduationCap size={18} color="var(--teal-light)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>E-Learning Progress</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
          <Award size={14} /> {totalProgress}% overall
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
          Not enrolled in any courses yet.{" "}
          <a href="/member/e-learning" style={{ color: "var(--gold)", textDecoration: "underline" }}>Explore courses</a>
        </div>
      ) : (
        <RankingBarChart
          data={chartData}
          height={Math.max(100, chartData.length * 36)}
          ariaLabel="Course completion percentage, ranked highest to lowest"
        />
      )}
      <a href="/member/courses" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
        View all courses <ChevronRight size={14} />
      </a>
    </div>
  );
}
