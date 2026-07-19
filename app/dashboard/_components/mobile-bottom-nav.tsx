"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, Shield, Bell, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { MobileMoreMenu } from "./mobile-more-menu";

interface BottomNavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const items: BottomNavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/dashboard" },
  { icon: <BookOpen size={18} />, label: "Library", href: "/dashboard/library" },
  { icon: <Users size={18} />, label: "Members", href: "/dashboard/users" },
  { icon: <Shield size={18} />, label: "Roles", href: "/dashboard/roles" },
  { icon: <Bell size={18} />, label: "Alerts", href: "/dashboard/notifications" },
];

/**
 * Fixed bottom tab bar with the highest-priority admin nav items, shown only
 * below the `md:` breakpoint, plus a "More" tab that opens `MobileMoreMenu`
 * covering every other sidebar destination (KCS Map, Publishing, Research,
 * Health System, etc.) that doesn't fit in the fixed 6-slot bar. Renders
 * alongside `Sidebar` (which hides itself below `md:`) rather than replacing
 * it — desktop sidebar behavior is untouched.
 */
export default function MobileBottomNav() {
  const [currentRoute, setCurrentRoute] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const { user } = useAuth();
  const isMember = user?.role === "member";

  useEffect(() => {
    setCurrentRoute(window.location.pathname);
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard" ? currentRoute === "/dashboard" : currentRoute.startsWith(href);

  return (
    <>
      <nav
        className="hidden max-md:flex fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "var(--bg-sidebar)",
          borderTop: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Admin bottom navigation"
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
        <button
          type="button"
          aria-label="More sections"
          onClick={() => setMoreOpen(true)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "8px 4px",
            fontSize: 9,
            background: "transparent",
            border: "none",
            color: moreOpen ? "var(--gold)" : "var(--text-secondary)",
            transition: "color 0.15s",
          }}
        >
          <MoreHorizontal size={18} />
          <span>More</span>
        </button>
      </nav>

      <MobileMoreMenu
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        isMember={isMember}
        currentRoute={currentRoute}
      />
    </>
  );
}
