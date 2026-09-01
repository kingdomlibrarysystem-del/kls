"use client";

import Link from "next/link";
import {
  Package,
  Plus,
  User,
  BarChart3,
  Database,
} from "lucide-react";
import { useResources } from "@/app/dashboard/library/_components/use-resources";
import { mediaTypeLabels } from "@/app/dashboard/library/_components/resources-data";

const sliceColors: Record<string, string> = {
  TEXT: "#d4a843",
  VIDEO: "#8b5cf6",
  AUDIO: "#f43f5e",
  DOCUMENT: "#0ea5e9",
  COMBINATION: "#22c55e",
};

const quickActions = [
  { icon: <Plus size={18} />, label: "Add New Item", sub: "Add book, audio, video…", href: "/dashboard/library" },
  { icon: <User size={18} />, label: "Register Member", sub: "Add new library member…", href: "/dashboard/users" },
  { icon: <BarChart3 size={18} />, label: "Generate Report", sub: "View analytics report…", href: "/dashboard/reports" },
  { icon: <Database size={18} />, label: "Manage Categories", sub: "KCS taxonomy…", href: "/dashboard/kcs" },
];

/** Real inventory breakdown by mediaType, quick actions linking to real pages, and the 4 most recently added resources — all from the real /api/resources-backed hook. */
export default function InventoryOverview() {
  const { data: resources } = useResources();

  const totalItems = resources.reduce((sum, r) => sum + r.totalQty, 0);
  const byMediaType = new Map<string, number>();
  resources.forEach((r) => byMediaType.set(r.mediaType, (byMediaType.get(r.mediaType) ?? 0) + r.totalQty));
  const slices = Array.from(byMediaType.entries())
    .map(([mediaType, count]) => ({
      label: mediaTypeLabels[mediaType as keyof typeof mediaTypeLabels] ?? mediaType,
      count,
      pct: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
      color: sliceColors[mediaType] ?? "#9aa0b4",
    }))
    .filter((s) => s.count > 0);

  const recentlyAdded = [...resources].slice(-4).reverse();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-0">
      {/* Donut */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Package size={14} /> Inventory Overview
        </div>
        {slices.length === 0 ? (
          <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>No resources yet.</div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <svg width="90" height="90" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
              {(() => { let offset = 0; return slices.map((s) => { const dash = `${s.pct} ${100 - s.pct}`; const el = (<circle key={s.label} cx="18" cy="18" r="15.9155" fill="none" stroke={s.color} strokeWidth="3.5" strokeDasharray={dash} strokeDashoffset={-offset + 25} />); offset += s.pct; return el; }); })()}
              <text x="18" y="16" textAnchor="middle" style={{ fill: "var(--gold)", fontSize: "4px", fontWeight: 700, fontFamily: "Cinzel,serif" }}>{totalItems.toLocaleString()}</text>
              <text x="18" y="21" textAnchor="middle" style={{ fill: "#9aa0b4", fontSize: "2.5px" }}>Total Items</text>
            </svg>
            <div style={{ flex: 1 }}>
              {slices.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "var(--text-secondary)", flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 600 }}>{s.count.toLocaleString()}</span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", width: 24, textAlign: "right" }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <Link href="/dashboard/library" className="btn btn-outline-dim btn-sm">Manage Inventory →</Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Plus size={14} /> Quick Actions
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href} aria-label={a.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px", cursor: "pointer", textDecoration: "none" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{a.label}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{a.sub}</div>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <Link href="/dashboard/library" className="btn btn-outline-dim btn-sm">All Actions →</Link>
        </div>
      </div>

      {/* Recently Added */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Plus size={14} /> Recently Added
        </div>
        {recentlyAdded.length === 0 ? (
          <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>No resources yet.</div>
        ) : (
          recentlyAdded.map((r) => (
            <Link key={r.id} href={`/dashboard/library`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)", textDecoration: "none" }}>
              <div style={{ width: 32, height: 32, background: "var(--bg-section)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={16} color="var(--gold)" />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 500 }}>{r.title}</span>
            </Link>
          ))
        )}
        <div style={{ marginTop: 8 }}>
          <Link href="/dashboard/library" className="btn btn-outline-dim btn-sm">View All Items →</Link>
        </div>
      </div>
    </div>
  );
}
