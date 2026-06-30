"use client";

import { useAuth } from "@/contexts/auth-context";
import { BookOpen, GraduationCap, User } from "lucide-react";

export default function MemberWelcome() {
  const { user } = useAuth();

  return (
    <div style={{ background: "var(--welcome-gradient)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "35%", backgroundImage: "var(--welcome-glow)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>
          Welcome back, {user?.firstName || "Guest"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, maxWidth: 420 }}>
          Explore your personal library — check borrowed books, track e-learning progress, and discover new resources.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="/member/library" className="btn btn-gold btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <BookOpen size={14} /> Browse Library
          </a>
          <a href="/member/e-learning" className="btn btn-outline btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <GraduationCap size={14} /> Go to E-Learning
          </a>
          <a href="/member/profile" className="btn btn-outline-dim btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <User size={14} /> My Profile
          </a>
        </div>
      </div>
    </div>
  );
}
