"use client";

const items = [
  { icon: "🧠",  label: "Book Consultation", sub: "Schedule a Session" },
  { icon: "📋",  label: "My Sessions",        sub: "Upcoming & Past"    },
  { icon: "👨⚕️", label: "Meet Counselors",   sub: "Browse Profiles"    },
  { icon: "💬",  label: "Live Chat Support",  sub: "Instant Help"       },
  { icon: "📂",  label: "Session Notes",      sub: "Secure & Private"   },
  { icon: "🎯",  label: "Goal Tracking",      sub: "Progress & Plans"   },
];

const stats = [
  { label: "Today's Sessions", value: "24", color: "var(--purple-light)" },
  { label: "Active Cases",     value: "87", color: "var(--teal-light)"   },
  { label: "Counselors",       value: "15", color: "var(--green-light)"  },
];

export default function ConsultationPanel() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--purple)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>🧠</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>CONSULTATION &amp; COUNSELING</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Care. Counsel. Restore.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 8 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 5, padding: "6px 4px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 8 }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-subtle)", borderRadius: 5, padding: "5px 6px", border: "1px solid var(--border-light)" }}>
            <span style={{ fontSize: 14 }}>{it.icon}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}>{it.label}</div>
              <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{it.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(139,92,246,0.12)", border: "1px solid var(--purple)", borderRadius: 5, padding: "6px 8px", marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Next Appointment</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--purple-light)" }}>Dr. Sarah Mukamana</div>
      </div>

      <button className="btn btn-purple btn-sm" style={{ width: "100%", justifyContent: "center" }}>
        Go to Counseling Center →
      </button>
    </div>
  );
}
