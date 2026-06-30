"use client";
import { ClipboardList, CheckCircle2, XCircle, Clock, FileText, ChevronRight } from "lucide-react";

const mockAssessments = [
  { id: 1, title: "Kingdom Foundations — Quiz 1", course: "Kingdom Foundations", score: 85, total: 100, status: "Passed", date: "Jun 20, 2026" },
  { id: 2, title: "Kingdom Foundations — Midterm", course: "Kingdom Foundations", score: null, total: 100, status: "Pending", date: "Jul 01, 2026" },
  { id: 3, title: "Understanding Divine Purpose — Quiz 1", course: "Understanding Divine Purpose", score: 70, total: 100, status: "Passed", date: "Jun 15, 2026" },
  { id: 4, title: "Understanding Divine Purpose — Quiz 2", course: "Understanding Divine Purpose", score: 60, total: 100, status: "Passed", date: "Jun 18, 2026" },
  { id: 5, title: "Leadership & Governance — Quiz 1", course: "Leadership & Governance", score: 45, total: 100, status: "Failed", date: "Jun 10, 2026" },
];

const passed = mockAssessments.filter((a) => a.status === "Passed");
const failed = mockAssessments.filter((a) => a.status === "Failed");
const pending = mockAssessments.filter((a) => a.status === "Pending");

export default function AssessmentsPage() {
  const avgScore = passed.length + failed.length > 0
    ? Math.round(passed.reduce((s, a) => s + (a.score || 0), 0) / (passed.length + failed.length))
    : 0;

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { icon: <ClipboardList size={16} />, label: "Total Taken", value: (passed.length + failed.length).toString(), color: "var(--text-primary)" },
          { icon: <CheckCircle2 size={16} />, label: "Passed", value: passed.length.toString(), color: "var(--green-light)" },
          { icon: <XCircle size={16} />, label: "Failed", value: failed.length.toString(), color: "var(--red-light)" },
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
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={16} color="var(--gold)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{a.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{a.course} • Due {a.date}</div>
              </div>
              <button style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                Start
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {[...passed, ...failed].length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
            Assessment History
          </div>
          {[...passed, ...failed].map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-section)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {a.status === "Passed" ? <CheckCircle2 size={16} color="var(--green-light)" /> : <XCircle size={16} color="var(--red-light)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{a.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{a.course} • {a.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {a.score !== null && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: a.status === "Passed" ? "var(--green-light)" : "var(--red-light)" }}>
                    {a.score}/{a.total}
                  </div>
                )}
                <div style={{ fontSize: 9, color: a.status === "Passed" ? "var(--green-light)" : "var(--red-light)" }}>{a.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
