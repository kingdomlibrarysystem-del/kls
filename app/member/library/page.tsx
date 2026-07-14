"use client";
import { useState } from "react";
import { Search, Grid3X3, List, Feather, Info } from "lucide-react";
import { kcsSections, allBooks } from "./_components/library-data";
import { ScrollCard, ScrollListItem } from "./_components/scroll-card";
import { WriteScrollModal } from "./_components/write-scroll-modal";

export default function MemberLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAbout, setShowAbout] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [toast, setToast] = useState("");

  const sections = activeSection === "All" ? kcsSections : kcsSections.filter((s) => s.label === activeSection);

  const filteredSections = sections.map((section) => ({
    ...section,
    scrolls: allBooks.filter((b) => b.section === section.label && b.title.toLowerCase().includes(search.toLowerCase())),
  })).filter((s) => s.scrolls.length > 0);

  const noResults = search.trim().length > 0 && filteredSections.length === 0;
  const totalBooks = allBooks.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>
            Kingdom Library
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, maxWidth: 400, lineHeight: 1.5 }}>
            The Bible is not one book — it is a library. {totalBooks} scrolls organized across {kcsSections.length} sections under the Kingdom Classification System (KCS).
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setShowAbout(!showAbout)}
            aria-label="About the Kingdom Classification System"
            style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", background: showAbout ? "rgba(212,168,67,0.15)" : "transparent", color: showAbout ? "var(--gold)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}
          >
            <Info size={12} /> About KCS
          </button>
          <button
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            style={{ padding: "6px 8px", background: view === "grid" ? "rgba(212,168,67,0.15)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: view === "grid" ? "var(--gold)" : "var(--text-muted)" }}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            style={{ padding: "6px 8px", background: view === "list" ? "rgba(212,168,67,0.15)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: view === "list" ? "var(--gold)" : "var(--text-muted)" }}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {showAbout && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", marginBottom: 6, fontFamily: "'Cinzel',serif" }}>Kingdom Classification System (KCS)</div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 6 }}>
            The KCS organizes Scripture according to divine pattern: <strong>Foundation → History → Wisdom → Prophetic → Gospel → Acts → Epistles → Revelation</strong>. This system ensures truth is not just known, but applied for transformation.
          </div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>Navigation replaces memorization.</strong> You don&apos;t need to memorize every verse — learn how to visit the right scrolls at the right time. Each section has a specific purpose, and every citizen can contribute their own Acts, Epistles, and Revelations.
          </div>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Search scrolls by title or section..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search scrolls by title or section"
          style={{
            width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg-input, var(--bg-card))", color: "var(--text-primary)", fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveSection("All")}
          style={{
            padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer",
            fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
            background: activeSection === "All" ? "var(--gold)" : "transparent",
            color: activeSection === "All" ? "#fff" : "var(--text-secondary)",
          }}
        >
          All Sections
        </button>
        {kcsSections.map((s) => (
          <button
            key={s.code}
            onClick={() => setActiveSection(s.label)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6,
              border: "1px solid var(--border)", cursor: "pointer", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
              background: activeSection === s.label ? "var(--gold)" : "transparent",
              color: activeSection === s.label ? "#fff" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ display: "flex" }}>{s.icon}</span>
            <span>{s.code}</span>
          </button>
        ))}
      </div>

      {noResults && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 11 }}>
          No scrolls match &ldquo;{search}&rdquo;.
        </div>
      )}

      {filteredSections.map((section) => (
        <div key={section.code} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{
            padding: "10px 14px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(90deg, rgba(212,168,67,0.05), transparent)",
          }}>
            <span style={{ display: "flex", color: "var(--gold)" }}>{section.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                {section.label}
                <span style={{ fontSize: 9, color: "var(--gold)", fontWeight: 600, fontFamily: "monospace" }}>{section.code}</span>
              </div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{section.desc}</div>
            </div>
            <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text-muted)" }}>{section.scrolls.length} scrolls</span>
          </div>

          <div style={{ display: view === "grid" ? "grid" : "flex", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 4, padding: 6, flexDirection: view === "list" ? "column" : undefined }}>
            {section.scrolls.map((scroll) => (
              view === "grid" ? (
                <ScrollCard key={scroll.id} scroll={scroll} />
              ) : (
                <ScrollListItem key={scroll.id} scroll={scroll} />
              )
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.08), var(--bg-card))", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
        <Feather size={24} color="var(--gold)" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>Your Scroll</div>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 10, maxWidth: 400, margin: "0 auto 10px", lineHeight: 1.5 }}>
          Every citizen of the Kingdom can contribute — write your own Acts (actions), Epistles (letters), and Revelations (visions). Add your story to the living archive.
        </div>
        <button
          onClick={() => setWriteOpen(true)}
          style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "var(--gold)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
        >
          Write Your Scroll
        </button>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--green-dim)", color: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 8, padding: "10px 16px", fontSize: 12, zIndex: 60 }}>
          {toast}
        </div>
      )}

      <WriteScrollModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmitted={() => {
          setWriteOpen(false);
          setToast("Your scroll has been submitted for review.");
          setTimeout(() => setToast(""), 3000);
        }}
      />
    </div>
  );
}
