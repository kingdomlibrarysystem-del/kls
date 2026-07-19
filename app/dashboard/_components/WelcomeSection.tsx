"use client";

const tabs = ["All", "Books", "Audio", "Video", "Newspapers", "Journals", "eBooks"];
const collection = [["Books","65,320"],["Audio","24,350"],["Video","18,450"],["Newspapers","9,560"],["Journals","7,000"],["eBooks","1,000"]];

export default function WelcomeSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto]">
      {/* Left */}
      <div
        className="sm:rounded-r-none"
        style={{ background: "var(--welcome-gradient)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", position: "relative", overflow: "hidden", minHeight: 170 }}
      >
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "45%", backgroundImage: "var(--welcome-glow)", pointerEvents: "none" }} />
        <div style={{ fontSize: 9, color: "var(--gold)", letterSpacing: 2, marginBottom: 3, fontWeight: 600 }}>WELCOME TO THE</div>
        <h1 style={{ fontFamily: "'Cinzel','Palatino Linotype',serif", fontSize: 26, fontWeight: 700, lineHeight: 1.1, color: "var(--text-primary)", margin: "0 0 6px" }}>KINGDOM LIBRARY</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 11, marginBottom: 12 }}>Learn. Innovate. Share Knowledge.</p>

        <div style={{ display: "flex", gap: 6, maxWidth: 420, marginBottom: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 5, padding: "0 10px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>🔍</span>
            <input placeholder="Search books, audio, video, newspapers, and more..." style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 11, flex: 1, padding: "7px 0" }} />
          </div>
          <button className="btn btn-gold btn-sm">Search</button>
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tabs.map((t, i) => (
            <button key={t} style={{ background: i === 0 ? "var(--gold)" : "var(--bg-subtle)", color: i === 0 ? "#fff" : "var(--text-secondary)", border: i === 0 ? "none" : "1px solid var(--border)", borderRadius: 4, padding: "3px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Right – collection */}
      <div
        className="w-full sm:w-40 sm:rounded-l-none mt-2 sm:mt-0"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", textAlign: "center", flexShrink: 0 }}
      >
        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 2 }}>TOTAL COLLECTION</div>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 26, fontWeight: 700, color: "var(--gold)", lineHeight: 1 }}>125,680+</div>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 8 }}>Items Available</div>
        <button className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>View Collection</button>
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />
        {collection.map(([label, count]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 10 }}>
            <span style={{ color: "var(--text-secondary)" }}>{label}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
