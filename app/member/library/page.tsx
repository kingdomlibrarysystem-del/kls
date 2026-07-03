"use client";
import { useState } from "react";
import {
  Search, BookOpen, Heart, Star, Grid3X3, List, Bookmark, Feather, ScrollText,
  History, Lightbulb, Radio, Rocket, BookCopy, Eye, Info, ChevronRight,
} from "lucide-react";

const kcsSections = [
  { code: "KCS-FND", label: "Foundation", icon: <ScrollText size={14} />, desc: "Constitution of the Kingdom — Origins, Laws, Covenant", books: ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"] },
  { code: "KCS-HIS", label: "History", icon: <History size={14} />, desc: "Record of the Kingdom — Leadership, Patterns, Restorations", books: ["Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther"] },
  { code: "KCS-WIS", label: "Wisdom", icon: <Lightbulb size={14} />, desc: "Knowledge of the Kingdom — Life, Health, Prosperity", books: ["Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Songs"] },
  { code: "KCS-PRP", label: "Prophetic", icon: <Radio size={14} />, desc: "Voice of the Kingdom — Correction, Promises, Hope", books: ["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"] },
  { code: "KCS-GOS", label: "Gospel", icon: <Heart size={14} />, desc: "King's Manifestation — Nature, Authority, Model", books: ["Matthew", "Mark", "Luke", "John"] },
  { code: "KCS-ACT", label: "Acts", icon: <Rocket size={14} />, desc: "Kingdom Expansion — Birth, Power, Community", books: ["Acts of the Apostles"] },
  { code: "KCS-EPI", label: "Epistles", icon: <BookCopy size={14} />, desc: "Kingdom Explained — Identity, Conduct, Structure", books: ["Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude"] },
  { code: "KCS-REV", label: "Revelation", icon: <Eye size={14} />, desc: "Kingdom Destiny — Throne, Judgment, Eternal", books: ["Revelation"] },
];

const allBooks = kcsSections.flatMap((section) =>
  section.books.map((title, i) => ({
    id: `${section.code}-${i}`,
    title,
    section: section.label,
    code: section.code,
    author: "The Holy Spirit",
    category: section.label,
    books: section.books.length,
  }))
);

export default function MemberLibraryPage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAbout, setShowAbout] = useState(false);

  const sections = activeSection === "All" ? kcsSections : kcsSections.filter((s) => s.label === activeSection);

  const filteredSections = sections.map((section) => ({
    ...section,
    books: section.books.filter((title) =>
      title.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => s.books.length > 0);

  const totalBooks = kcsSections.reduce((s, sec) => s + sec.books.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
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
            style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", background: showAbout ? "rgba(212,168,67,0.15)" : "transparent", color: showAbout ? "var(--gold)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}
          >
            <Info size={12} /> About KCS
          </button>
          <button
            onClick={() => setView("grid")}
            style={{ padding: "6px 8px", background: view === "grid" ? "rgba(212,168,67,0.15)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: view === "grid" ? "var(--gold)" : "var(--text-muted)" }}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            style={{ padding: "6px 8px", background: view === "list" ? "rgba(212,168,67,0.15)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", color: view === "list" ? "var(--gold)" : "var(--text-muted)" }}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* About KCS */}
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

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Search scrolls by title, author, or section..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--bg-input, var(--bg-card))", color: "var(--text-primary)", fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* KCS Section Navigation */}
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

      {/* Section displays */}
      {filteredSections.map((section) => (
        <div key={section.code} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {/* Section header */}
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
            <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text-muted)" }}>{section.books.length} scrolls</span>
          </div>

          {/* Book list in this section */}
          <div style={{ display: view === "grid" ? "grid" : "flex", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 4, padding: 6, flexDirection: view === "list" ? "column" : undefined }}>
            {section.books.map((title) => (
              view === "grid" ? (
                <ScrollCard key={title} title={title} code={section.code} section={section.label} />
              ) : (
                <ScrollListItem key={title} title={title} code={section.code} section={section.label} desc={section.desc} />
              )
            ))}
          </div>
        </div>
      ))}

      {/* Your Scroll */}
      <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.08), var(--bg-card))", border: "1px solid var(--gold-dim, rgba(212,168,67,0.3))", borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
        <Feather size={24} color="var(--gold)" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>Your Scroll</div>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 10, maxWidth: 400, margin: "0 auto 10px", lineHeight: 1.5 }}>
          Every citizen of the Kingdom can contribute — write your own Acts (actions), Epistles (letters), and Revelations (visions). Add your story to the living archive.
        </div>
        <button style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "var(--gold)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Write Your Scroll
        </button>
      </div>
    </div>
  );
}

function ScrollCard({ title, code, section }: { title: string; code: string; section: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <div
      style={{
        background: "var(--bg-subtle, var(--bg-card))", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ height: 80, background: "linear-gradient(135deg, rgba(212,168,67,0.1), var(--bg-section))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <ScrollText size={28} color="var(--gold)" />
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          style={{
            position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.2)", border: "none", borderRadius: "50%",
            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <Heart size={10} color={liked ? "var(--red-light)" : "#fff"} fill={liked ? "var(--red-light)" : "none"} />
        </button>
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: "var(--gold)", background: "rgba(212,168,67,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{code}</span>
          <span style={{ fontSize: 8, color: "var(--text-muted)" }}>{section}</span>
        </div>
        <button style={{ width: "100%", padding: "5px 0", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 9, cursor: "pointer" }}>
          Open Scroll
        </button>
      </div>
    </div>
  );
}

function ScrollListItem({ title, code, section, desc }: { title: string; code: string; section: string; desc: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ width: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><ScrollText size={20} color="var(--gold)" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
          <span style={{ fontSize: 8, color: "var(--gold)", background: "rgba(212,168,67,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{code}</span>
          <span style={{ fontSize: 8, color: "var(--text-muted)" }}>{section}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
        style={{ padding: "4px 6px", border: "none", background: "transparent", cursor: "pointer", color: liked ? "var(--red-light)" : "var(--text-muted)" }}
      >
        <Heart size={12} fill={liked ? "var(--red-light)" : "none"} />
      </button>
      <ChevronRight size={14} color="var(--text-muted)" />
    </div>
  );
}
