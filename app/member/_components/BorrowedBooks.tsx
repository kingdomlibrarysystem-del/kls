"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { useBorrowings } from "@/app/member/_shared/use-borrowings";

/** Dashboard-home widget for active borrowings, reading from the real /api/borrowings-backed hook — mirrors CurrentlyReading.tsx's live-wired pattern. */
export default function BorrowedBooks() {
  const { data: borrowings } = useBorrowings();
  const active = borrowings.filter((b) => b.status === "active" || b.status === "overdue" || b.status === "pending");

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <BookOpen size={18} color="var(--gold)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Currently Borrowed</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>{active.length} items</span>
      </div>
      {active.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
          No books borrowed yet.{" "}
          <a href="/member/library" style={{ color: "var(--gold)", textDecoration: "underline" }}>Browse the library</a>
        </div>
      ) : (
        active.map((b) => {
          const isOverdue = b.status === "overdue";
          return (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ width: 36, height: 36, background: "var(--bg-section)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={16} color="var(--gold)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{b.resourceTitle}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.resourceType}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: isOverdue ? "var(--red-light)" : "var(--green-light)", fontWeight: 600 }}>
                  {b.status === "pending" ? "Pending" : isOverdue ? "Overdue" : "Active"}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Due {b.dueDate}</div>
              </div>
            </div>
          );
        })
      )}
      <a href="/member/borrowings" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
        View all borrowings <ChevronRight size={14} />
      </a>
    </div>
  );
}
