"use client";

import { BookOpen, ChevronRight } from "lucide-react";

const mockBorrows = [
  { title: "Kingdom Principles", author: "Dr. Myles Munroe", borrowed: "Jun 20, 2026", due: "Jul 04, 2026", status: "Active" },
  { title: "The Power of Purpose", author: "Dr. Myles Munroe", borrowed: "Jun 15, 2026", due: "Jun 29, 2026", status: "Active" },
];

export default function BorrowedBooks() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <BookOpen size={16} color="var(--gold)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Currently Borrowed</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>{mockBorrows.length} items</span>
      </div>
      {mockBorrows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 11 }}>
          No books borrowed yet.{" "}
          <a href="/member/library" style={{ color: "var(--gold)", textDecoration: "underline" }}>Browse the library</a>
        </div>
      ) : (
        mockBorrows.map((b) => (
          <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ width: 32, height: 32, background: "var(--bg-section)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={14} color="var(--gold)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{b.author}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "var(--green-light)", fontWeight: 600 }}>{b.status}</div>
              <div style={{ fontSize: 8, color: "var(--text-muted)" }}>Due {b.due}</div>
            </div>
          </div>
        ))
      )}
      <a href="/member/borrowings" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 10, color: "var(--gold)", textDecoration: "none" }}>
        View all borrowings <ChevronRight size={12} />
      </a>
    </div>
  );
}
