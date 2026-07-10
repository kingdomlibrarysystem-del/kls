"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SWITCHABLE_ROLES, roleViewLabel, roleViewRoute } from "@/lib/role-switcher";
import {
  Home,
  GraduationCap,
  ClipboardList,
  CalendarClock,
  MessageSquare,
  BookCopy,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: <GraduationCap size={14} />, label: "My Courses", href: "/lecturer/courses" },
  { icon: <ClipboardList size={14} />, label: "Session Requests", href: "/lecturer/sessions/requests" },
  { icon: <CalendarClock size={14} />, label: "My Sessions", href: "/lecturer/sessions" },
  { icon: <MessageSquare size={14} />, label: "Messages", href: "/lecturer/messages" },
];

/**
 * Lecturer portal sidebar — structural mirror of `ContributorSidebar`
 * (same collapsible width, Dialect B styling, role switcher), per the
 * Phase 1 design decision to reuse the contributor shell exactly.
 */
export default function LecturerSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, switchRole } = useAuth();
  const currentRoute = typeof window !== "undefined" ? window.location.pathname : "";

  const isActive = (href: string) => {
    if (href === "/lecturer") return currentRoute === "/lecturer";
    return currentRoute.startsWith(href);
  };

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        minWidth: collapsed ? 56 : 220,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        transition: "width 0.2s",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "14px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            background: "linear-gradient(135deg, var(--gold-dim), var(--gold))",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BookCopy size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div className="cinzel" style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", lineHeight: 1.2 }}>
              KINGDOM
            </div>
            <div className="cinzel" style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", lineHeight: 1.2 }}>
              LIBRARY
            </div>
            <div style={{ fontSize: 8, color: "var(--text-muted)", letterSpacing: 1 }}>
              LECTURER PORTAL
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {/* Dashboard home */}
        <Link
          href="/lecturer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            textDecoration: "none",
            fontSize: 12,
            background: isActive("/lecturer") ? "rgba(212,168,67,0.12)" : "transparent",
            borderLeft: isActive("/lecturer") ? "2px solid var(--gold)" : "2px solid transparent",
            color: isActive("/lecturer") ? "var(--gold)" : "var(--text-secondary)",
            transition: "all 0.15s",
            marginBottom: 4,
          }}
        >
          <Home size={14} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Nav items */}
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              textDecoration: "none",
              fontSize: 12,
              color: isActive(item.href) ? "var(--gold)" : "var(--text-secondary)",
              background: isActive(item.href) ? "rgba(212,168,67,0.12)" : "transparent",
              borderLeft: isActive(item.href) ? "2px solid var(--gold)" : "2px solid transparent",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!isActive(item.href)) e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { if (!isActive(item.href)) e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {/* Role simulation */}
        {!collapsed && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "6px 12px" }} />
            <div style={{ padding: "6px 12px 4px", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1 }}>
              SWITCH VIEW
            </div>
            {SWITCHABLE_ROLES.map((r) => (
              <div
                key={r}
                onClick={() => { switchRole(r); window.location.href = roleViewRoute[r]; }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px",
                  cursor: "pointer",
                  fontSize: 11,
                  color: user?.role === r ? "var(--gold)" : "var(--text-secondary)",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => {
                  if (user?.role !== r) e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <Shield size={12} />
                {roleViewLabel[r]}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
