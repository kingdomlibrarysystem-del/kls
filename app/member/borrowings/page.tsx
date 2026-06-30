"use client";
import { BookOpen, RotateCcw, AlertTriangle, Calendar, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";

const mockBorrowings = [
  { id: 1, title: "Kingdom Principles", author: "Dr. Myles Munroe", borrowed: "Jun 10, 2026", due: "Jun 24, 2026", status: "Active", cover: "📖" },
  { id: 2, title: "The Power of Purpose", author: "Dr. Myles Munroe", borrowed: "Jun 15, 2026", due: "Jun 29, 2026", status: "Active", cover: "📕" },
  { id: 3, title: "Understanding Divine Direction", author: "Dr. Myles Munroe", borrowed: "May 20, 2026", due: "Jun 03, 2026", status: "Overdue", cover: "📗" },
  { id: 4, title: "Kingdom Leadership", author: "Dr. Myles Munroe", borrowed: "Apr 01, 2026", due: "Apr 15, 2026", status: "Returned", cover: "📘", returned: "Apr 14, 2026" },
  { id: 5, title: "The Culture of the Kingdom", author: "Dr. Myles Munroe", borrowed: "Mar 10, 2026", due: "Mar 24, 2026", status: "Returned", cover: "📙", returned: "Mar 22, 2026" },
];

export default function BorrowingsPage() {
  const active = mockBorrowings.filter((b) => b.status === "Active" || b.status === "Overdue");
  const returned = mockBorrowings.filter((b) => b.status === "Returned");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
          My Borrowings
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          Track your borrowed books and return history
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { icon: <BookOpen size={16} />, label: "Active Loans", value: active.length.toString(), color: "var(--teal-light)" },
          { icon: <AlertTriangle size={16} />, label: "Overdue", value: active.filter((b) => b.status === "Overdue").length.toString(), color: "var(--red-light)" },
          { icon: <CheckCircle2 size={16} />, label: "Returned", value: returned.length.toString(), color: "var(--green-light)" },
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

      {/* Active borrowings */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <RotateCcw size={14} color="var(--gold)" /> Currently Borrowed
        </div>
        {active.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>You have no active borrowings.</div>
        ) : (
          active.map((b) => {
            const isOverdue = b.status === "Overdue";
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ fontSize: 24, width: 40, textAlign: "center" }}>{b.cover}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{b.author}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: isOverdue ? "var(--red-light)" : "var(--green-light)", fontWeight: 600 }}>{b.status}</div>
                  <div style={{ fontSize: 8, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                    <Calendar size={10} /> Due {b.due}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            );
          })
        )}
      </div>

      {/* Return history */}
      {returned.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} color="var(--text-muted)" /> Return History
          </div>
          {returned.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 24, width: 40, textAlign: "center" }}>{b.cover}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{b.author}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "var(--green-light)", fontWeight: 600 }}>Returned</div>
                <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{b.returned}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
