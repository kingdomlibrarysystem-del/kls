"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, GraduationCap, ClipboardList, CalendarClock, MessageSquare } from "lucide-react";

interface BottomNavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const items: BottomNavItem[] = [
  { icon: <Home size={18} />, label: "Dashboard", href: "/lecturer" },
  { icon: <GraduationCap size={18} />, label: "Courses", href: "/lecturer/courses" },
  { icon: <ClipboardList size={18} />, label: "Requests", href: "/lecturer/sessions/requests" },
  { icon: <CalendarClock size={18} />, label: "Sessions", href: "/lecturer/sessions" },
  { icon: <MessageSquare size={18} />, label: "Messages", href: "/lecturer/messages" },
];

/**
 * Fixed bottom tab bar with the highest-priority lecturer nav items, shown
 * only below the `md:` breakpoint. Renders alongside `LecturerSidebar`
 * (which hides itself below `md:`) rather than replacing it — mirrors
 * `ContributorMobileBottomNav` exactly.
 */
export default function LecturerMobileBottomNav() {
  const [currentRoute, setCurrentRoute] = useState("");

  useEffect(() => {
    setCurrentRoute(window.location.pathname);
  }, []);

  const isActive = (href: string) =>
    href === "/lecturer" ? currentRoute === "/lecturer" : currentRoute.startsWith(href);

  return (
    <nav
      className="hidden max-md:flex fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "var(--bg-sidebar)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Lecturer bottom navigation"
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
