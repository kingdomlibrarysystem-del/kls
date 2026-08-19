"use client";
import Link from "next/link";
import { Award, BookX, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useCourses, type CatalogCourse } from "../_shared/use-courses";
import { useEnrollments, getProgressPercent, isCertificateEligible } from "../_shared/use-enrollments";
import { InProgressCoursesSection } from "./_components/in-progress-courses-section";
import { CompletedCoursesSection } from "./_components/completed-courses-section";
import { RequestSessionModal } from "./_components/request-session-modal";
import { useState } from "react";

export default function MyCoursesPage() {
  const [requesting, setRequesting] = useState<CatalogCourse | null>(null);
  const { data: enrollments, loading: enrollmentsLoading } = useEnrollments();
  const { data: courseCatalog, loading: coursesLoading } = useCourses();
  const loading = enrollmentsLoading || coursesLoading;

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
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Courses
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          Track your enrolled courses and continue learning
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "conic-gradient(var(--teal-light) " + totalProgress + "%, var(--bg-section) " + totalProgress + "%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--teal-light)" }}>
            {totalProgress}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Overall Progress</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{completed.length} of {rows.length} courses completed</div>
        </div>
        <Award size={24} color="var(--gold)" />
      </div>

      {/* Certificate eligibility banner */}
      {eligibleForCertificate.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(212,168,67,0.08)", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "10px 14px" }}>
          <Sparkles size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>
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
      <InProgressCoursesSection inProgress={inProgress} onRequestSession={setRequesting} />

      {/* Completed */}
      <CompletedCoursesSection completed={completed} onRequestSession={setRequesting} />

      <RequestSessionModal course={requesting} onClose={() => setRequesting(null)} />
    </div>
  );
}
