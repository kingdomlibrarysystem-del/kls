"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SWITCHABLE_ROLES, roleViewLabel, roleViewRoute } from "@/lib/role-switcher";
import {
  Home,
  BookOpen,
  Bookmark,
  CalendarDays,
  Search,
  GraduationCap,
  CheckSquare,
  ClipboardList,
  Award,
  User,
  ChevronDown,
  ChevronLeft,
  BookCopy,
  Trophy,
  Heart,
  CalendarClock,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Library",
    icon: <BookOpen size={14} />,
    items: [
      { icon: <BookOpen size={12} />, label: "Browse Books", href: "/member/library" },
      { icon: <Bookmark size={12} />, label: "My Borrowings", href: "/member/borrowings" },
      { icon: <CalendarDays size={12} />, label: "Reservations", href: "/member/reservations" },
      { icon: <Search size={12} />, label: "Search Catalog", href: "/member/library" },
    ],
  },
  {
    title: "E-Learning",
    icon: <GraduationCap size={14} />,
    items: [
      { icon: <GraduationCap size={12} />, label: "Browse Courses", href: "/member/e-learning" },
      { icon: <CheckSquare size={12} />, label: "My Courses", href: "/member/courses" },
      { icon: <ClipboardList size={12} />, label: "Assessments", href: "/member/assessments" },
      { icon: <Award size={12} />, label: "Certificates", href: "/member/certificates" },
      { icon: <CalendarClock size={12} />, label: "My Sessions", href: "/member/sessions" },
    ],
  },
];

const singleItems: NavItem[] = [
  { icon: <MessageSquare size={14} />, label: "Messages", href: "/member/messages" },
  { icon: <Heart size={14} />, label: "Favorites", href: "/member/favorites" },
  { icon: <Trophy size={14} />, label: "Leaderboard", href: "/member/leaderboard" },
  { icon: <User size={14} />, label: "My Profile", href: "/member/profile" },
];

export default function MemberSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Library": true,
    "E-Learning": false,
  });
  const { user, switchRole } = useAuth();
  const currentRoute = usePathname();

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => {
    if (href === "/member") return currentRoute === "/member";
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
              MEMBER PORTAL
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {/* Dashboard home */}
        <Link
          href="/member"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            textDecoration: "none",
            fontSize: 12,
            background: isActive("/member") ? "rgba(212,168,67,0.12)" : "transparent",
            borderLeft: isActive("/member") ? "2px solid var(--gold)" : "2px solid transparent",
            color: isActive("/member") ? "var(--gold)" : "var(--text-secondary)",
            transition: "all 0.15s",
            marginBottom: 4,
          }}
        >
          <Home size={14} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Nav sections */}
        {!collapsed && navSections.map((section) => (
          <div key={section.title}>
            <div
              onClick={() => toggleSection(section.title)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: 1,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {section.icon}
              <span style={{ flex: 1 }}>{section.title}</span>
              {expandedSections[section.title] ? <ChevronDown size={12} /> : <ChevronLeft size={12} />}
            </div>
            {expandedSections[section.title] && section.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px 5px 32px",
                  textDecoration: "none",
                  fontSize: 11,
                  color: isActive(item.href) ? "var(--gold)" : "var(--text-secondary)",
                  background: isActive(item.href) ? "rgba(212,168,67,0.08)" : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!isActive(item.href)) e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { if (!isActive(item.href)) e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}

        {/* Single items */}
        {!collapsed && <div style={{ height: 1, background: "var(--border)", margin: "6px 12px" }} />}
        {singleItems.map((item) => (
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
                {roleViewLabel[r]}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
