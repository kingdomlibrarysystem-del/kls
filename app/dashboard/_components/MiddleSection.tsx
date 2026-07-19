"use client";

import Link from "next/link";
import {
  BookOpen,
  Music,
  Landmark,
  Newspaper,
  ClipboardList,
  Bot,
  Shield,
  DollarSign,
  FlaskConical,
  ShoppingCart,
  Star,
  Plus,
} from "lucide-react";

const popular = [
  { icon: <BookOpen size={16} />, label: "The Kingdom Mindset",       type: "Book",      count: 2850 },
  { icon: <Music size={16} />, label: "Sound of Revival",           type: "Audio",     count: 1980 },
  { icon: <Landmark size={16} />, label: "Kingdom Foundations",        type: "Video",     count: 1450 },
  { icon: <Newspaper size={16} />, label: "Daily Nation – Today",       type: "Newspaper", count: 980  },
  { icon: <ClipboardList size={16} />, label: "Health & Healing Journal",   type: "Journal",   count: 760  },
];

const books = [
  { title: "Destiny of a Kingdom",  price: "$15.00", color: "#8b1a1a" },
  { title: "Kingdom Principles",    price: "$18.00", color: "#1a3a6b" },
  { title: "Healing & Restoration", price: "$12.00", color: "#1a4a2a" },
];

const news = [
  { title: "Kingdom Library Expands to 5 New Countries",     date: "May 20, 2024" },
  { title: "New Book Release: The Culture of the Kingdom",   date: "May 20, 2024" },
  { title: "Community Reading Campaign This June",            date: "May 19, 2024" },
  { title: "Global Webinar: Kingdom Leadership Principles",  date: "May 19, 2024" },
];

const recent = [
  { icon: <Bot size={16} />, label: "AI in Kingdom Governance"      },
  { icon: <Shield size={16} />, label: "The Power of Unity"            },
  { icon: <DollarSign size={16} />, label: "Kingdom Finance Guide"         },
  { icon: <FlaskConical size={16} />, label: "Virtual Lab: Faith & Science"  },
];

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "var(--bg-card)", border: "1px solid var(--border)", padding: "10px 12px", borderRadius: 8, ...extra,
});

export default function MiddleSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-0">

      {/* Sales */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <ShoppingCart size={14} /> Sales &amp; Store
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {books.map((b) => (
            <div key={b.title} style={{ flex: 1, background: b.color, borderRadius: 6, padding: "8px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <BookOpen size={24} color="#fff" />
              <div style={{ fontSize: 8, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>{b.title}</div>
              <div style={{ fontSize: 10, color: "var(--gold)", fontWeight: 700 }}>{b.price}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>In Stock</div>
            </div>
          ))}
        </div>
        <button className="btn btn-gold btn-sm" style={{ width: "100%", justifyContent: "center" }}>Go to Store →</button>
      </div>

      {/* Popular */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Star size={14} /> Popular Resources
        </div>
        {popular.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
            <span style={{ display: "flex", alignItems: "center" }}>{r.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}>{r.label}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{r.type}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>{r.count.toLocaleString()}</div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}><Link href="/dashboard/library" className="btn btn-outline-dim btn-sm">View All Resources →</Link></div>
      </div>

      {/* Recently Added */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Plus size={14} /> Recently Added
        </div>
        {recent.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ width: 36, height: 36, background: "var(--bg-section)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{r.icon}</div>
            <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 500 }}>{r.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 8 }}><button className="btn btn-outline-dim btn-sm">View All Items →</button></div>
      </div>

      {/* News */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          <Newspaper size={14} /> News &amp; Newspapers
        </div>
        {news.map((n) => (
          <div key={n.title} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ width: 32, height: 32, background: "var(--bg-section)", borderRadius: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{n.title}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{n.date}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}><Link href="/dashboard/news" className="btn btn-outline-dim btn-sm">View All News →</Link></div>
      </div>

    </div>
  );
}
