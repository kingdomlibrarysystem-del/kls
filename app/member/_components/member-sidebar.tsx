"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
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
  ChevronDown,
  ChevronLeft,
  BookCopy,
  Trophy,
  Heart,
  CalendarClock,
  MessageSquare,
  ShoppingBag,
  ShoppingCart,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { UserMenu } from "@/components/app-shell/user-menu";

interface NavItem {
  icon: React.ReactNode;
  key: string;
  href: string;
}

interface NavSection {
  key: string;
  icon: React.ReactNode;
  items: NavItem[];
}

function buildNavSections(t: (k: string) => string): NavSection[] {
  return [
    {
      key: "library",
      icon: <BookOpen size={16} />,
      items: [
        { icon: <BookOpen size={14} />, key: "browse_books", href: "/member/library" },
        { icon: <Bookmark size={14} />, key: "my_borrowings", href: "/member/borrowings" },
        { icon: <CalendarDays size={14} />, key: "reservations", href: "/member/reservations" },
        { icon: <ShoppingCart size={14} />, key: "my_cart", href: "/member/cart" },
        { icon: <ShoppingBag size={14} />, key: "my_orders", href: "/member/orders" },
      ],
    },
    {
      key: "elearning",
      icon: <GraduationCap size={16} />,
      items: [
        { icon: <GraduationCap size={14} />, key: "browse_courses", href: "/member/e-learning" },
        { icon: <CheckSquare size={14} />, key: "my_courses", href: "/member/courses" },
        { icon: <ClipboardList size={14} />, key: "assessments", href: "/member/assessments" },
        { icon: <Award size={14} />, key: "certificates", href: "/member/certificates" },
        { icon: <CalendarClock size={14} />, key: "my_sessions", href: "/member/sessions" },
      ],
    },
  ]
}

function buildSingleItems(t: (k: string) => string): NavItem[] {
  return [
    { icon: <Bell size={16} />, key: "notifications", href: "/member/notifications" },
    { icon: <MessageSquare size={16} />, key: "messages", href: "/member/messages" },
    { icon: <Heart size={16} />, key: "favorites", href: "/member/favorites" },
    { icon: <Trophy size={16} />, key: "leaderboard", href: "/member/leaderboard" },
  ]
}

export default function MemberSidebar() {
  const { t } = useLanguage();
  const navSections = buildNavSections(t);
  const singleItems = buildSingleItems(t);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    library: true,
    elearning: false,
  });
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
        width: collapsed ? 64 : 248,
        minWidth: collapsed ? 64 : 248,
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
            width: 42,
            height: 42,
            minWidth: 42,
            background: "linear-gradient(135deg, var(--gold-dim), var(--gold))",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BookCopy size={20} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div
              className="cinzel"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--gold)",
                lineHeight: 1.2,
              }}
            >
              KINGDOM
            </div>
            <div
              className="cinzel"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--gold)",
                lineHeight: 1.2,
              }}
            >
              LIBRARY
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: 1,
              }}
            >
              {t("member.portal")}
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
            gap: 10,
            padding: "9px 14px",
            textDecoration: "none",
            fontSize: 14,
            background: isActive("/member")
              ? "rgba(212,168,67,0.12)"
              : "transparent",
            borderLeft: isActive("/member")
              ? "2px solid var(--gold)"
              : "2px solid transparent",
            color: isActive("/member")
              ? "var(--gold)"
              : "var(--text-secondary)",
            transition: "all 0.15s",
            marginBottom: 4,
          }}
        >
          <Home size={16} />
          {!collapsed && <span>{t("member.dashboard")}</span>}
        </Link>

        {/* Nav sections */}
        {!collapsed &&
          navSections.map((section) => (
            <div key={section.key}>
              <div
                onClick={() => toggleSection(section.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: 1,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--gold)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                {section.icon}
                <span style={{ flex: 1 }}>{t(`member.section_${section.key}`)}</span>
                {expandedSections[section.key] ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronLeft size={14} />
                )}
              </div>
              {expandedSections[section.key] &&
                section.items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 14px 7px 36px",
                      textDecoration: "none",
                      fontSize: 13,
                      color: isActive(item.href)
                        ? "var(--gold)"
                        : "var(--text-secondary)",
                      background: isActive(item.href)
                        ? "rgba(212,168,67,0.08)"
                        : "transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.href))
                        e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.href))
                        e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    {item.icon}
                    <span>{t(`member.${item.key}`)}</span>
                  </Link>
                ))}
            </div>
          ))}

        {/* Single items */}
        {!collapsed && (
          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "6px 12px",
            }}
          />
        )}
        {singleItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 14px",
              textDecoration: "none",
              fontSize: 14,
              color: isActive(item.href)
                ? "var(--gold)"
                : "var(--text-secondary)",
              background: isActive(item.href)
                ? "rgba(212,168,67,0.12)"
                : "transparent",
              borderLeft: isActive(item.href)
                ? "2px solid var(--gold)"
                : "2px solid transparent",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.href))
                e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.href))
                e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {item.icon}
            {!collapsed && <span>{t(`member.${item.key}`)}</span>}
          </Link>
        ))}

        {!collapsed && (
          <div
            style={{
              height: 1,
              background: "var(--border)",
              margin: "6px 12px",
            }}
          />
        )}
        {!collapsed && <UserMenu profileHref="/member/profile" align="left" />}
      </div>
    </aside>
  );
}
