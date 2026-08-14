"use client";

import Link from "next/link";
import {
  BookOpen,
  AlertTriangle,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Bookmark,
} from "lucide-react";
import { useBorrowingsAdmin } from "@/app/dashboard/library/borrowings/_components/use-borrowings-admin";
import { useReservationsAdmin } from "@/app/dashboard/reservations/_components/use-reservations-admin";

const statusColor: Record<string, string> = {
  active: "var(--green-light)",
  overdue: "var(--red-light)",
  returned: "var(--text-muted)",
  pending: "var(--gold)",
  rejected: "var(--text-muted)",
};

/** Real Borrow/Return/Reservations summary — stats and the recent-loans table both read the real /api/borrowings and /api/reservations, replacing fabricated numbers and rows. */
export default function BorrowReturn() {
  const { data: borrowings } = useBorrowingsAdmin();
  const { data: reservations } = useReservationsAdmin();

  const active = borrowings.filter((b) => b.status === "active").length;
  const overdue = borrowings.filter((b) => b.status === "overdue").length;
  const dueToday = borrowings.filter((b) => b.status === "active" && b.dueDate === new Date().toISOString().split("T")[0]).length;

  const stats = [
    { icon: <BookOpen size={16} />, label: "Currently", value: active, color: "var(--teal-light)" },
    { icon: <AlertTriangle size={16} />, label: "Overdue Items", value: overdue, color: "var(--red-light)" },
    { icon: <Calendar size={16} />, label: "Reservations", value: reservations.length, color: "var(--gold)" },
    { icon: <Calendar size={16} />, label: "Due Today", value: dueToday, color: "var(--orange-light)" },
  ];

  const recentLoans = borrowings.slice(0, 6);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        <BookOpen size={14} /> Borrow, Return &amp; Reservations
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 6, marginBottom: 8 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <Link href="/dashboard/library/borrowings" className="btn btn-gold btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowDownToLine size={12} /> Borrow Item</Link>
        <Link href="/dashboard/library/borrowings" className="btn btn-outline btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowUpFromLine size={12} /> Return Item</Link>
        <Link href="/dashboard/library/borrowings" className="btn btn-outline-dim btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><ClipboardList size={12} /> My Loans</Link>
        <Link href="/dashboard/reservations" className="btn btn-outline-dim btn-sm" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}><Bookmark size={12} /> My Reservations</Link>
      </div>

      {/* Table */}
      <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 5, letterSpacing: 0.5 }}>RECENT BORROWED ITEMS</div>
      {recentLoans.length === 0 ? (
        <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>No borrowings yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: 420 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "3px 6px", color: "var(--text-muted)", fontWeight: 600, fontSize: 9, paddingBottom: 4, borderBottom: "1px solid var(--border)", marginBottom: 3 }}>
              <span>Item</span><span>Type</span><span>Borrowed On</span><span>Due Date</span><span>Status</span>
            </div>
            {recentLoans.map((l) => (
              <div key={l.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "3px 6px", alignItems: "center", padding: "3px 0", borderBottom: "1px solid var(--border-light)", color: "var(--text-secondary)", fontSize: 10 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{l.resourceTitle}</span>
                <span>{l.resourceType}</span>
                <span>{l.borrowDate}</span>
                <span>{l.dueDate}</span>
                <span style={{ color: statusColor[l.status], fontWeight: 600, textTransform: "capitalize" }}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <Link href="/dashboard/library/borrowings" className="btn btn-outline-dim btn-sm">View All Loans →</Link>
      </div>
    </div>
  );
}
