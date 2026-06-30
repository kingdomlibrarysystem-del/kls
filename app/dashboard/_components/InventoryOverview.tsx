"use client";

import {
  Package,
  Plus,
  User,
  BarChart3,
  Database,
  Bot,
  Shield,
  DollarSign,
  FlaskConical,
} from "lucide-react";

const slices = [
  { label: "Books",      count: "65,320", pct: 52, color: "#d4a843" },
  { label: "Audio",      count: "24,350", pct: 19, color: "#0ea5e9" },
  { label: "Video",      count: "18,450", pct: 15, color: "#8b5cf6" },
  { label: "Newspapers", count: "9,560",  pct: 8,  color: "#22c55e" },
  { label: "Journals",   count: "7,000",  pct: 6,  color: "#f97316" },
  { label: "eBooks",     count: "1,000",  pct: 1,  color: "#f472b6" },
];

const quickActions = [
  { icon: <Plus size={18} />, label: "Add New Item",      sub: "Add book, audio, video…"  },
  { icon: <User size={18} />, label: "Register Member",   sub: "Add new library member…"  },
  { icon: <BarChart3 size={18} />, label: "Generate Report",   sub: "View analytics report…"   },
  { icon: <Database size={18} />, label: "Backup Data",       sub: "Library data backup…"     },
];

const recentlyAdded = [
  { icon: <Bot size={16} />, label: "AI in Kingdom Governance"      },
  { icon: <Shield size={16} />, label: "The Power of Unity"            },
  { icon: <DollarSign size={16} />, label: "Kingdom Finance Guide"         },
  { icon: <FlaskConical size={16} />, label: "Virtual Lab: Faith & Science"  },
];

export default function InventoryOverview() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
      {/* Donut */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px 0 0 8px", borderRight: "none", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Package size={14} /> Inventory Overview
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <svg width="90" height="90" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
            {(() => { let offset = 0; return slices.map((s) => { const dash = `${s.pct} ${100 - s.pct}`; const el = (<circle key={s.label} cx="18" cy="18" r="15.9155" fill="none" stroke={s.color} strokeWidth="3.5" strokeDasharray={dash} strokeDashoffset={-offset + 25} />); offset += s.pct; return el; }); })()}
            <text x="18" y="16" textAnchor="middle" style={{ fill: "var(--gold)", fontSize: "4px", fontWeight: 700, fontFamily: "Cinzel,serif" }}>125,680</text>
            <text x="18" y="21" textAnchor="middle" style={{ fill: "#9aa0b4", fontSize: "2.5px" }}>Total Items</text>
          </svg>
          <div style={{ flex: 1 }}>
            {slices.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "var(--text-secondary)", flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 600 }}>{s.count}</span>
                <span style={{ fontSize: 9, color: "var(--text-muted)", width: 24, textAlign: "right" }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-outline-dim btn-sm">Manage Inventory →</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 0, borderRight: "none", borderLeft: "none", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Plus size={14} /> Quick Actions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {quickActions.map((a) => (
            <div key={a.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px", cursor: "pointer" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{a.label}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{a.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-outline-dim btn-sm">All Actions →</button>
        </div>
      </div>

      {/* Recently Added */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0 8px 8px 0", borderLeft: "none", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Plus size={14} /> Recently Added
        </div>
        {recentlyAdded.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ width: 32, height: 32, background: "var(--bg-section)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.icon}</div>
            <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 500 }}>{r.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-outline-dim btn-sm">View All Items →</button>
        </div>
      </div>
    </div>
  );
}
