"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, BookOpen, GraduationCap, Award, User } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface BottomNavItem {
  icon: React.ReactNode;
  key: string;
  href: string;
}

const items: BottomNavItem[] = [
  { icon: <Home size={20} />, key: "dashboard", href: "/member" },
  { icon: <BookOpen size={20} />, key: "library", href: "/member/library" },
  { icon: <GraduationCap size={20} />, key: "learning", href: "/member/e-learning" },
  { icon: <Award size={20} />, key: "certificates", href: "/member/certificates" },
  { icon: <User size={20} />, key: "profile", href: "/member/profile" },
];

/**
 * Fixed bottom tab bar with the highest-priority member nav items, shown only
 * below the `md:` breakpoint. Renders alongside `MemberSidebar` (which hides
 * itself below `md:`) rather than replacing it — desktop sidebar behavior is
 * untouched.
 */
export default function MemberMobileBottomNav() {
  const { t } = useLanguage();
  const [currentRoute, setCurrentRoute] = useState("");

  useEffect(() => {
    setCurrentRoute(window.location.pathname);
  }, []);

  const isActive = (href: string) =>
    href === "/member" ? currentRoute === "/member" : currentRoute.startsWith(href);

  return (
    <nav
      className="hidden max-md:flex fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "var(--bg-sidebar)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Member bottom navigation"
    >
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={t(`member.${item.key}`)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "9px 4px",
              fontSize: 10,
              textDecoration: "none",
              color: active ? "var(--gold)" : "var(--text-secondary)",
              transition: "color 0.15s",
            }}
          >
            {item.icon}
            <span>{t(`member.${item.key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
