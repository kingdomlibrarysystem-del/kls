"use client";

import { Heart, ChevronRight } from "lucide-react";

const mockFavorites = [
  { title: "Destiny of a Kingdom", author: "Dr. Myles Munroe" },
  { title: "The Culture of the Kingdom", author: "Dr. Myles Munroe" },
  { title: "Kingdom Leadership", author: "Dr. Myles Munroe" },
];

export default function FavoriteBooks() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Heart size={16} color="var(--red-light)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Favorite Books</span>
      </div>
      {mockFavorites.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 11 }}>
          No favorites yet. Start adding books you love!
        </div>
      ) : (
        mockFavorites.map((b) => (
          <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ width: 28, height: 28, background: "rgba(239,68,68,0.1)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={12} color="var(--red-light)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</div>
              <div style={{ fontSize: 8, color: "var(--text-muted)" }}>{b.author}</div>
            </div>
          </div>
        ))
      )}
      <a href="/member/library" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 10, color: "var(--gold)", textDecoration: "none" }}>
        Browse library <ChevronRight size={12} />
      </a>
    </div>
  );
}
