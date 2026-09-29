"use client";

import Link from "next/link";
import {
  BookOpen,
  Star,
  Plus,
} from "lucide-react";
import type { AdminDashboardData } from "@/lib/data/admin-dashboard";

const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border)", padding: "10px 12px", borderRadius: 8 };

/**
 * Popular Resources and Recently Added, both real. "Popular" is a real
 * borrow-count aggregation over /api/borrowings — not a fabricated
 * ranking. Sales & Store and News & Newspapers panels were removed
 * entirely (per explicit product decision): neither has a real backend
 * (no Sales/Transaction model exists; News is a Phase-9 placeholder),
 * so faking their numbers here would be worse than not showing them.
 * Both lists are computed server-side (a borrow groupBy for "popular",
 * newest-by-createdAt for "recent") and passed in.
 */
export default function MiddleSection({ popular, recent }: { popular: AdminDashboardData["popular"]; recent: AdminDashboardData["inventory"]["newest"] }) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-0">
      {/* Popular */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Star size={14} /> Popular Resources
        </div>
        {popular.length === 0 ? (
          <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>No borrowing activity yet.</div>
        ) : (
          popular.map((p) => (
            <div key={p.resource.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
              <span style={{ display: "flex", alignItems: "center" }}><BookOpen size={16} color="var(--gold)" /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}>{p.resource.title}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{p.resource.type}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>{p.count} {p.count === 1 ? "borrow" : "borrows"}</div>
            </div>
          ))
        )}
        <div style={{ marginTop: 8 }}><Link href="/dashboard/library" className="btn btn-outline-dim btn-sm">View All Resources →</Link></div>
      </div>

      {/* Recently Added */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Plus size={14} /> Recently Added
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>No resources yet.</div>
        ) : (
          recent.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
              <div style={{ width: 36, height: 36, background: "var(--bg-section)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={16} color="var(--gold)" /></div>
              <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 500 }}>{r.title}</span>
            </div>
          ))
        )}
        <div style={{ marginTop: 8 }}><Link href="/dashboard/library" className="btn btn-outline-dim btn-sm">View All Items →</Link></div>
      </div>
    </div>
  );
}
