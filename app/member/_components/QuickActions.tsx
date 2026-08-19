"use client";

import { BookOpen, GraduationCap, Bookmark, Clock, Search, Heart } from "lucide-react";

const actions = [
  { icon: <BookOpen size={20} />, label: "Browse Library", href: "/member/library", color: "var(--gold)" },
  { icon: <GraduationCap size={20} />, label: "E-Learning", href: "/member/e-learning", color: "var(--teal-light)" },
  { icon: <Search size={20} />, label: "Search Resources", href: "/member/library", color: "var(--purple-light)" },
  { icon: <Clock size={20} />, label: "My Borrowings", href: "/member/borrowings", color: "var(--orange-light)" },
  { icon: <Heart size={20} />, label: "Favorites", href: "/member/library", color: "var(--red-light)" },
  { icon: <Bookmark size={20} />, label: "Reservations", href: "/member/reservations", color: "var(--green-light)" },
];

export default function QuickActions() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Quick Actions</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {actions.map((a) => (
          <a key={a.label} href={a.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 6px", textDecoration: "none", cursor: "pointer" }}>
            <span style={{ color: a.color }}>{a.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>{a.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
