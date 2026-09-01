"use client";
import Link from "next/link";
import { Award, BookX, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useCourses, type CatalogCourse } from "../_shared/use-courses";
import { useEnrollments, getProgressPercent, isCertificateEligible, unenrollFromCourse } from "../_shared/use-enrollments";
import { useCertificates } from "../_shared/use-certificates";
import { InProgressCoursesSection } from "./_components/in-progress-courses-section";
import { CompletedCoursesSection } from "./_components/completed-courses-section";
import { RequestSessionModal } from "./_components/request-session-modal";
import { CourseCheckoutModal } from "./_components/course-checkout-modal";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";

export default function MyCoursesPage() {
  const { t } = useLanguage();
  const [requesting, setRequesting] = useState<CatalogCourse | null>(null);
  const [checkoutCourse, setCheckoutCourse] = useState<CatalogCourse | null>(null);
  const { data: enrollments, loading: enrollmentsLoading, refetch: refetchEnrollments } = useEnrollments();
  const { data: courseCatalog, loading: coursesLoading } = useCourses();
  const { data: certificates } = useCertificates();
  const loading = enrollmentsLoading || coursesLoading;

  const handleUnenroll = async (enrollmentId: string) => {
    try {
      await unenrollFromCourse(enrollmentId);
      await refetchEnrollments();
    } catch {
      // Silently keep the row as-is on failure — the button remains available to retry.
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-label={t("m_courses.loading_courses")}>
        <Skeleton style={{ height: 68, borderRadius: 8 }} />
        <Skeleton style={{ height: 140, borderRadius: 8 }} />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={BookX}
        title={t("m_courses.no_courses")}
        description={t("m_courses.no_courses_desc")}
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
          {t("m_courses.title")}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          {t("m_courses.subtitle")}
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
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t("m_courses.overall_progress")}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{completed.length} of {rows.length} {t("m_courses.of_completed")}</div>
        </div>
        <Award size={24} color="var(--gold)" />
      </div>

      {/* Certificate ready banner — the certificate already exists by the time a course is eligible (issued server-side on completion), so this links straight to it rather than implying a future action. */}
      {eligibleForCertificate.length > 0 && (() => {
        const singleCert = eligibleForCertificate.length === 1
          ? certificates.find((c) => c.courseId === eligibleForCertificate[0].course.id)
          : undefined;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(212,168,67,0.08)", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "10px 14px" }}>
            <Sparkles size={20} color="var(--gold)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: "var(--text-primary)" }}>
              {eligibleForCertificate.length === 1
                ? <>{t("m_courses.cert_ready_for")} &ldquo;{eligibleForCertificate[0].course.title}&rdquo;.</>
                : <>{t("m_courses.certs_ready")} {eligibleForCertificate.length} {t("m_courses.courses_word")}.</>}
            </div>
            <Link href={singleCert ? `/member/certificates/${singleCert.id}` : "/member/certificates"} className="btn btn-gold btn-sm" aria-label={eligibleForCertificate.length === 1 ? t("m_courses.view_cert") : t("m_courses.view_certs")}>
              {eligibleForCertificate.length === 1 ? t("m_courses.view_cert") : t("m_courses.view_certs")}
            </Link>
          </div>
        );
      })()}

      {/* In progress */}
      <InProgressCoursesSection inProgress={inProgress} onRequestSession={setRequesting} onUnenroll={handleUnenroll} onPay={setCheckoutCourse} />

      {/* Completed */}
      <CompletedCoursesSection completed={completed} onRequestSession={setRequesting} certificates={certificates} onUnenroll={handleUnenroll} onPay={setCheckoutCourse} />

      <div style={{ textAlign: "center" }}>
        <Link href="/member/e-learning" style={{ fontSize: 13, fontWeight: 600, color: "var(--teal-light)", textDecoration: "none" }}>
          {t("m_courses.browse_more")}
        </Link>
      </div>

      <RequestSessionModal course={requesting} onClose={() => setRequesting(null)} availableCourses={rows.map((r) => r.course)} />
      <CourseCheckoutModal
        course={checkoutCourse}
        onClose={() => setCheckoutCourse(null)}
        onPaid={() => { refetchEnrollments(); setCheckoutCourse(null); }}
      />
    </div>
  );
}
