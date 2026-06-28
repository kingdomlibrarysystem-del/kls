"use client";

const cardAccents = ["var(--card-accent-1)", "var(--card-accent-2)", "var(--card-accent-3)"];
const dlCards = [
  { icon: "🧠", label: "Knowledge Management", sub: "Best Practices & Guide" },
  { icon: "🤖", label: "AI & Automation",       sub: "AI Solutions & Tools" },
  { icon: "🔬", label: "Virtual Labs",           sub: "Simulations & Experiments" },
  { icon: "💬", label: "Smart Chatbots",         sub: "AI-Powered Support" },
  { icon: "📡", label: "IoT & Analytics",        sub: "Data Insights & Monitoring" },
  { icon: "💡", label: "Innovation Hub",         sub: "Ideas & Prototyping" },
  { icon: "🔗", label: "Blockchain",             sub: "Secure & Transparent" },
  { icon: "📚", label: "E-Learning Courses",     sub: "Learn & Upskill" },
];

const dlBottom = [
  { icon: "🎓", label: "Tech Webinars",       sub: "Upcoming Live Sessions" },
  { icon: "⬇️", label: "Download Center",     sub: "Ebooks & Resources"     },
  { icon: "📖", label: "Ebooks & Resources",  sub: ""                       },
];

export default function DigitalLibrary() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>💻 Digital Library — Learn. Innovate. Share Knowledge.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 6 }}>
        {dlCards.map((c, i) => (
          <div key={c.label} style={{ background: cardAccents[i % cardAccents.length], border: "1px solid var(--border)", borderRadius: 6, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 4, cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>{c.icon}</span>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{c.label}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {dlBottom.map((c) => (
          <div key={c.label} style={{ background: "var(--bg-section)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{c.label}</div>
              {c.sub && <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{c.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
