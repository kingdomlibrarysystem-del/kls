"use client";

const publishingItems = [
  { icon: "📤", label: "Submit Manuscript",   sub: "Submit your work"   },
  { icon: "📋", label: "My Submissions",       sub: "Track status"       },
  { icon: "✅", label: "Review & Approve",     sub: "Editorial review"   },
  { icon: "💰", label: "Revenue & Royalties",  sub: "Earnings"           },
  { icon: "📚", label: "Publication Catalog",  sub: "Browse catalog"     },
  { icon: "📊", label: "Analytics",            sub: "Performance"        },
];

const researchItems = [
  { icon: "📊", label: "Research Dashboard",  sub: "Overview & Analytics"   },
  { icon: "📁", label: "Research Projects",   sub: "Manage & Track"         },
  { icon: "📚", label: "Research Library",    sub: "Papers, Journals…"      },
  { icon: "🤖", label: "AI Research Assist",  sub: "Smart Support"          },
  { icon: "📤", label: "Publish Research",    sub: "Journals & Papers"      },
  { icon: "🤝", label: "Collaborations",      sub: "Teams & Partnerships"   },
  { icon: "💾", label: "Data Center",         sub: "Datasets & Analytics"   },
  { icon: "📅", label: "Conferences",         sub: "Events & Webinars"      },
  { icon: "⚖️", label: "Research Ethics",     sub: "Compliance & Ethics"    },
  { icon: "💸", label: "Funding Opps",        sub: "Grants & Support"       },
];

const beautyItems = [
  { icon: "💄", label: "Beauty Dashboard",    sub: "Overview & Analytics"   },
  { icon: "🧘", label: "Wellness & Spa",      sub: "Relaxation & Therapy"   },
  { icon: "🩺", label: "Smart Consultation",  sub: "AI Skin & Hair Analysis" },
  { icon: "💇", label: "Hair & Skin Care",    sub: "Treatments & Programs"  },
  { icon: "📅", label: "Book Appointment",    sub: "Schedule Services"      },
  { icon: "🪞", label: "Virtual Try-On",      sub: "AI Beauty Experience"   },
  { icon: "🎓", label: "Beauty Academy",      sub: "Courses & Certificates" },
  { icon: "👥", label: "Beauty Community",    sub: "Connect & Share"        },
];

function ItemGrid({ items }: { items: { icon: string; label: string; sub: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 8 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-subtle)", borderRadius: 5, padding: "4px 5px", border: "1px solid var(--border-light)" }}>
          <span style={{ fontSize: 12 }}>{it.icon}</span>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-primary)" }}>{it.label}</div>
            <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{it.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatRow({ values }: { values: [string, string][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${values.length},1fr)`, gap: 5, marginBottom: 8 }}>
      {values.map(([v, l]) => (
        <div key={l} style={{ textAlign: "center", background: "rgba(212,168,67,0.05)", border: "1px solid var(--border-gold)", borderRadius: 5, padding: "5px 4px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{v}</div>
          <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

export default function RightPanels() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Publishing */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--gold)", borderRadius: 8, padding: "10px 12px", marginBottom: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", marginBottom: 2 }}>📰 PUBLISHING SERVICES</div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8 }}>Discover. Publish. Transform.</div>
        <StatRow values={[["1,240","Books"],["38","In Progress"],["12","Published"]]} />
        <ItemGrid items={publishingItems} />
        <button className="btn btn-gold btn-sm" style={{ width: "100%", justifyContent: "center" }}>Start Publishing →</button>
      </div>

      {/* Research */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--teal)", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-light)", marginBottom: 2 }}>🔬 RESEARCH SERVICES</div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8 }}>Discover. Publish. Transform.</div>
        <ItemGrid items={researchItems} />
        <button className="btn btn-outline-dim btn-sm" style={{ width: "100%", justifyContent: "center", color: "var(--teal-light)", borderColor: "var(--teal)" }}>Go to Research Center →</button>
      </div>

      {/* Beauty */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--pink)", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pink)", marginBottom: 2 }}>💅 BEAUTY &amp; WELLNESS</div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8 }}>Beauty. Wellness. Transform.</div>
        <ItemGrid items={beautyItems} />
        <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center", background: "var(--pink)", color: "#fff" }}>Go to Beauty Center →</button>
      </div>

    </div>
  );
}
