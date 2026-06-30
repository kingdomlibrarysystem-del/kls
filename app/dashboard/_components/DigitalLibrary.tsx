"use client";

import {
  ScrollText,
  History,
  Lightbulb,
  Radio,
  Heart,
  Rocket,
  BookCopy,
  Eye,
  Feather,
  Monitor,
  BookOpen,
  Search,
} from "lucide-react";

const kcsSections = [
  { icon: <ScrollText size={18} />, code: "KCS-FND", label: "Foundation", desc: "Constitution of the Kingdom — Origins, Laws, Covenant", color: "var(--card-accent-1)" },
  { icon: <History size={18} />, code: "KCS-HIS", label: "History", desc: "Record of the Kingdom — Leadership, Patterns, Restorations", color: "var(--card-accent-2)" },
  { icon: <Lightbulb size={18} />, code: "KCS-WIS", label: "Wisdom", desc: "Knowledge of the Kingdom — Life, Health, Prosperity", color: "var(--card-accent-3)" },
  { icon: <Radio size={18} />, code: "KCS-PRP", label: "Prophetic", desc: "Voice of the Kingdom — Correction, Promises, Hope", color: "var(--card-accent-1)" },
  { icon: <Heart size={18} />, code: "KCS-GOS", label: "Gospel", desc: "King's Manifestation — Nature, Authority, Model", color: "var(--card-accent-2)" },
  { icon: <Rocket size={18} />, code: "KCS-ACT", label: "Acts", desc: "Kingdom Expansion — Birth, Power, Community", color: "var(--card-accent-3)" },
  { icon: <BookCopy size={18} />, code: "KCS-EPI", label: "Epistles", desc: "Kingdom Explained — Identity, Conduct, Structure", color: "var(--card-accent-1)" },
  { icon: <Eye size={18} />, code: "KCS-REV", label: "Revelation", desc: "Kingdom Destiny — Throne, Judgment, Eternal", color: "var(--card-accent-2)" },
];

export default function DigitalLibrary() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        <BookOpen size={16} /> Kingdom Library — KCS Classification
      </div>

      <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.5 }}>
        The Bible is not one book — it is a library. Navigate by section to find truth with purpose.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 5, marginBottom: 6 }}>
        {kcsSections.map((s) => (
          <div
            key={s.code}
            style={{
              background: s.color,
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "8px 6px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ display: "flex", alignItems: "center", color: "var(--gold)" }}>{s.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)" }}>{s.code}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", marginBottom: 1 }}>{s.label}</div>
            <div style={{ fontSize: 8, color: "var(--text-muted)", lineHeight: 1.3 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1, background: "var(--bg-section)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Feather size={16} color="var(--gold)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>Your Scroll</div>
            <div style={{ fontSize: 8, color: "var(--text-muted)" }}>Add your Acts & Epistles</div>
          </div>
        </div>
        <div style={{ flex: 1, background: "var(--bg-section)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Search size={16} color="var(--gold)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>Search</div>
            <div style={{ fontSize: 8, color: "var(--text-muted)" }}>Navigate the library</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 8, color: "var(--text-muted)", textAlign: "center", borderTop: "1px solid var(--border-light)", paddingTop: 6 }}>
        Navigation replaces memorization — visit the right scrolls at the right time.
      </div>
    </div>
  );
}
