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

const loans = [
  { item: "Kingdom Principles",   type: "Book",      borrowed: "May 18, 2024", due: "May 28, 2024", status: "Active"   },
  { item: "The Power of Worship", type: "Audio",     borrowed: "May 17, 2024", due: "May 27, 2024", status: "Active"   },
  { item: "Leadership & Order",   type: "Book",      borrowed: "May 16, 2024", due: "May 26, 2024", status: "Active"   },
  { item: "Leadership & Order",   type: "Book",      borrowed: "May 15, 2024", due: "May 25, 2024", status: "Overdue"  },
  { item: "Kingdom Documentary",  type: "Video",     borrowed: "May 15, 2024", due: "May 25, 2024", status: "Overdue"  },
  { item: "Daily News – May 15",  type: "Newspaper", borrowed: "May 15, 2024", due: "May 16, 2024", status: "Returned" },
];

const statusColor: Record<string, string> = {
  Active:   "var(--green-light)",
  Overdue:  "var(--red-light)",
  Returned: "var(--text-muted)",
};

const stats = [
  { icon: <BookOpen size={16} />, label: "Currently",     value: 128, color: "var(--teal-light)"   },
  { icon: <AlertTriangle size={16} />, label: "Overdue Items", value: 8,   color: "var(--red-light)"    },
  { icon: <Calendar size={16} />, label: "Reservations",  value: 15,  color: "var(--gold)"         },
  { icon: <Calendar size={16} />, label: "Due Today",     value: 23,  color: "var(--orange-light)" },
];

export default function BorrowReturn() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        <BookOpen size={14} /> Borrow, Return &amp; Reservations
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 8 }}>
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
        <button className="btn btn-outline btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowUpFromLine size={12} /> Return Item</button>
        <button className="btn btn-outline-dim btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}><ClipboardList size={12} /> My Loans</button>
        <button className="btn btn-outline-dim btn-sm" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}><Bookmark size={12} /> My Reservations</button>
      </div>

      {/* Table */}
      <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, marginBottom: 5, letterSpacing: 0.5 }}>RECENT BORROWED ITEMS</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "3px 6px", color: "var(--text-muted)", fontWeight: 600, fontSize: 9, paddingBottom: 4, borderBottom: "1px solid var(--border)", marginBottom: 3 }}>
        <span>Item</span><span>Type</span><span>Borrowed On</span><span>Due Date</span><span>Status</span>
      </div>
      {loans.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "3px 6px", alignItems: "center", padding: "3px 0", borderBottom: "1px solid var(--border-light)", color: "var(--text-secondary)", fontSize: 10 }}>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{l.item}</span>
          <span>{l.type}</span>
          <span>{l.borrowed}</span>
          <span>{l.due}</span>
          <span style={{ color: statusColor[l.status], fontWeight: 600 }}>{l.status}</span>
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <Link href="/dashboard/library/borrowings" className="btn btn-outline-dim btn-sm">View All Loans →</Link>
      </div>
    </div>
  );
}
