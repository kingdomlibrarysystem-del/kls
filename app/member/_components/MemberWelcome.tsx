"use client";

import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { BookOpen, GraduationCap, User } from "lucide-react";

export default function MemberWelcome() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div style={{ background: "var(--welcome-gradient)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "35%", backgroundImage: "var(--welcome-glow)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif", marginBottom: 4 }}>
          {t("m_welcome.welcome_back")} {user?.firstName || t("m_welcome.guest")}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 14, maxWidth: 420 }}>
          {t("m_welcome.explore_desc")}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href="/member/library" className="btn btn-gold btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <BookOpen size={16} /> {t("m_welcome.browse_library")}
          </a>
          <a href="/member/e-learning" className="btn btn-outline btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <GraduationCap size={16} /> {t("m_welcome.go_elearning")}
          </a>
          <a href="/member/profile" className="btn btn-outline-dim btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <User size={16} /> {t("m_profile.title")}
          </a>
        </div>
      </div>
    </div>
  );
}
