"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { courseCatalog } from "../_shared/course-catalog-data";
import { useAssessmentAttempts } from "../_shared/use-assessment-attempts";
import { useAssessmentCatalog } from "../_shared/use-assessments";

/** Simulated network delay before the shared assessment-attempt store's initial snapshot is shown. */
const LOAD_DELAY_MS = 300;

export default function AssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const attempts = useAssessmentAttempts();
  const takeableAssessments = useAssessmentCatalog();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-label="Loading assessments">
        <Skeleton style={{ height: 60, borderRadius: 8 }} />
        <Skeleton style={{ height: 140, borderRadius: 8 }} />
      </div>
    );
  }

  const takenIds = new Set(attempts.map((a) => a.assessmentId));
  const pending = Object.values(takeableAssessments).filter((a) => !takenIds.has(a.id));
  const underReview = attempts.filter((a) => a.reviewStatus === "PENDING_REVIEW");
  const decided = attempts.filter((a) => a.reviewStatus !== "PENDING_REVIEW");
  const passed = decided.filter((a) => a.status === "PASSED");
  const failed = decided.filter((a) => a.status === "FAILED");
  const avgScore = decided.length > 0
    ? Math.round(decided.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / decided.length)
    : 0;

  const courseTitleFor = (assessmentId: string) => {
    const assessment = takeableAssessments[assessmentId];
    return courseCatalog.find((c) => c.id === assessment?.courseId)?.title ?? "Unknown course";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          Assessments
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Track your quiz scores and upcoming assessments
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5" style={{ display: "grid", gap: 10 }}>
        {[
          { icon: <ClipboardList size={16} />, label: "Total Taken", value: attempts.length.toString(), color: "var(--text-primary)" },
          { icon: <CheckCircle2 size={16} />, label: "Passed", value: passed.length.toString(), color: "var(--green-light)" },
          { icon: <XCircle size={16} />, label: "Failed", value: failed.length.toString(), color: "var(--red-light)" },
          { icon: <Clock size={16} />, label: "Under Review", value: underReview.length.toString(), color: "var(--gold)" },
          { icon: <FileText size={16} />, label: "Avg Score", value: `${avgScore}%`, color: "var(--gold)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming/Pending */}
      {pending.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} color="var(--gold)" /> Upcoming Assessments
          </div>
          {pending.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--border-light)", flexWrap: "wrap" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={16} color="var(--gold)" />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{a.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{courseTitleFor(a.id)}</div>
              </div>
              <Link
                href={`/member/assessments/${a.id}/take`}
                aria-label={`Start ${a.title}`}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 600, textDecoration: "none" }}
              >
                Start
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {attempts.length > 0 ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
            Assessment History
          </div>
          {attempts.map((a) => {
            const isPending = a.reviewStatus === "PENDING_REVIEW";
            const statusColor = isPending ? "var(--gold)" : a.status === "PASSED" ? "var(--green-light)" : "var(--red-light)";
            return (
              <div key={a.assessmentId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isPending ? <Clock size={16} color={statusColor} /> : a.status === "PASSED" ? <CheckCircle2 size={16} color={statusColor} /> : <XCircle size={16} color={statusColor} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{takeableAssessments[a.assessmentId]?.title ?? a.assessmentId}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{courseTitleFor(a.assessmentId)} • {a.takenAt}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                    {a.score}/{a.totalMarks}
                  </div>
                  <div style={{ fontSize: 9, color: statusColor }}>
                    {isPending ? "Under Review" : a.status === "PASSED" ? "Passed" : "Failed"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assessments yet"
          description="Assessments linked to your enrolled courses will appear here."
          style={{ color: "var(--text-secondary)" }}
        />
      ) : null}
    </div>
  );
}
