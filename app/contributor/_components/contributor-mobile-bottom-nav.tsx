"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Upload, BookCopy, DollarSign, GraduationCap } from "lucide-react";

interface BottomNavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const items: BottomNavItem[] = [
  { icon: <Home size={18} />, label: "Dashboard", href: "/contributor" },
  { icon: <Upload size={18} />, label: "Submit", href: "/contributor/publishing/submit" },
  { icon: <BookCopy size={18} />, label: "Submissions", href: "/contributor/publishing" },
  { icon: <DollarSign size={18} />, label: "Earnings", href: "/contributor/earnings" },
  { icon: <GraduationCap size={18} />, label: "Courses", href: "/contributor/courses" },
];

/**
 * Fixed bottom tab bar with the highest-priority contributor nav items, shown
 * only below the `md:` breakpoint. Renders alongside `ContributorSidebar`
 * (which hides itself below `md:`) rather than replacing it — desktop
 * sidebar behavior is untouched.
 */
export default function ContributorMobileBottomNav() {
  const [currentRoute, setCurrentRoute] = useState("");

  useEffect(() => {
    setCurrentRoute(window.location.pathname);
  }, []);

  const isActive = (href: string) =>
    href === "/contributor" ? currentRoute === "/contributor" : currentRoute.startsWith(href);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "var(--bg-sidebar)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Contributor bottom navigation"
    >
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "8px 4px",
              fontSize: 9,
              textDecoration: "none",
              color: active ? "var(--gold)" : "var(--text-secondary)",
              transition: "color 0.15s",
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
