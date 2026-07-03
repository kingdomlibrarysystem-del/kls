"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PlayCircle, GraduationCap, ChevronRight, Award, BookX, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { courseCatalog } from "../_shared/course-catalog-data";
import { useEnrollments, getProgressPercent, isCertificateEligible, getNextLessonId } from "../_shared/use-enrollments";

/** Simulated network delay before the shared enrollment store's initial snapshot is shown. */
const LOAD_DELAY_MS = 300;

export default function MyCoursesPage() {
  const [loading, setLoading] = useState(true);
  const enrollments = useEnrollments();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-label="Loading your courses">
        <Skeleton style={{ height: 68, borderRadius: 8 }} />
        <Skeleton style={{ height: 140, borderRadius: 8 }} />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={BookX}
        title="No courses yet"
        description="Enroll in a course from the catalog to start learning."
        style={{ color: "var(--text-secondary)" }}
      />
    );
  }

  const rows = enrollments
    .map((e) => ({ enrollment: e, course: courseCatalog.find((c) => c.id === e.courseId) }))
    .filter((r): r is { enrollment: typeof enrollments[number]; course: NonNullable<typeof r.course> } => !!r.course);

  const inProgress = rows.filter((r) => r.enrollment.status !== "COMPLETED");
  const completed = rows.filter((r) => r.enrollment.status === "COMPLETED");
  const totalProgress = rows.length ? Math.round(rows.reduce((s, r) => s + getProgressPercent(r.enrollment), 0) / rows.length) : 0;
  const eligibleForCertificate = completed.filter((r) => isCertificateEligible(r.enrollment));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Courses
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Track your enrolled courses and continue learning
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "conic-gradient(var(--teal-light) " + totalProgress + "%, var(--bg-section) " + totalProgress + "%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--teal-light)" }}>
            {totalProgress}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>Overall Progress</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{completed.length} of {rows.length} courses completed</div>
        </div>
        <Award size={24} color="var(--gold)" />
      </div>

      {/* Certificate eligibility banner */}
      {eligibleForCertificate.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(212,168,67,0.08)", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "10px 14px" }}>
          <Sparkles size={18} color="var(--gold)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 11, color: "var(--text-primary)" }}>
            {eligibleForCertificate.length === 1
              ? `You're eligible for a certificate in "${eligibleForCertificate[0].course.title}".`
              : `You're eligible for certificates in ${eligibleForCertificate.length} courses.`}
          </div>
          <Link href="/member/certificates" className="btn btn-gold btn-sm" aria-label="View certificates">
            View Certificates
          </Link>
        </div>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <PlayCircle size={14} color="var(--teal-light)" /> Continue Learning
          </div>
          {inProgress.map(({ enrollment, course }) => {
            const progress = getProgressPercent(enrollment);
            const nextLessonId = getNextLessonId(enrollment);
            return (
              <div key={course.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><course.image size={20} color="var(--gold)" /></div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{course.title}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{course.instructor} • {enrollment.completedLessonIds.length}/{enrollment.totalLessons} lessons</div>
                  <div style={{ width: "100%", height: 4, background: "var(--bg-section)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "var(--teal-light)", borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                </div>
                {nextLessonId ? (
                  <Link
                    href={`/member/courses/${course.id}/lessons/${nextLessonId}`}
                    aria-label={`Resume ${course.title}`}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--teal-light)", background: "transparent", color: "var(--teal-light)", fontSize: 10, fontWeight: 600, textDecoration: "none" }}
                  >
                    Resume
                  </Link>
                ) : (
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>No lessons available</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Award size={14} color="var(--gold)" /> Completed
          </div>
          {completed.map(({ enrollment, course }) => (
            <div key={course.id} style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><course.image size={16} color="var(--gold)" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{course.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
                  {course.lessons} lessons • Completed
                  {!isCertificateEligible(enrollment) && " • Pass the assessment for a certificate"}
                </div>
              </div>
              {isCertificateEligible(enrollment) ? <GraduationCap size={14} color="var(--gold)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
