"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import {
  Sun,
  Moon,
  RotateCcw,
  Database,
  Newspaper,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Printer,
  FlaskConical,
  Sparkles,
  Brain,
  Search,
  Bell,
} from "lucide-react";

const topLinks = [
  { icon: <RotateCcw size={14} />, label: "Borrow & Return", sub: "Books, Audio, Video", href: "/dashboard/library/borrowings" },
  { icon: <Database size={14} />, label: "E-Resources", sub: "Digital Content", href: undefined },
  { icon: <Newspaper size={14} />, label: "News & Newspapers", sub: "Latest Updates", href: "/dashboard/news" },
  { icon: <ShoppingCart size={14} />, label: "Sales & Store", sub: "Media, Books, Merch", href: "/dashboard/library/sales" },
  { icon: <Package size={14} />, label: "Inventory", sub: "Manage Collection", href: "/dashboard/library" },
  { icon: <Users size={14} />, label: "Members", sub: "Manage Users", href: "/dashboard/users" },
  { icon: <BarChart3 size={14} />, label: "Reports", sub: "Analytics & Insights", href: "/dashboard/reports" },
  {
    icon: <Printer size={14} />,
    label: "Publishing Services",
    sub: "Publish, Distribute, Impact.",
    href: "/dashboard/publishing",
  },
  {
    icon: <FlaskConical size={14} />,
    label: "Research Services",
    sub: "Discover, Publish, Transform.",
    href: "/dashboard/research",
  },
  { icon: <Sparkles size={14} />, label: "Beauty Services", sub: "Beauty, Wellness, Transform.", href: "/dashboard/beauty" },
  {
    icon: <Brain size={14} />,
    label: "Consultation & Counseling",
    sub: "Care, Counsel, Restore.",
    href: "/dashboard/counseling",
  },
];

export default function DashboardTopbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header
      style={{
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Top bar */}
      <div
        className="flex-wrap sm:flex-nowrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          minHeight: 52,
          borderBottom: "1px solid var(--border)",
          gap: 8,
        }}
      >
        <div className="hidden md:block" style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <div
            className="cinzel"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--gold)",
              letterSpacing: 1,
            }}
          >
            KINGDOM LIBRARY – KCS INTELLIGENT PLATFORM
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: 2,
            }}
          >
            THE WORLD'S MOST ADVANCED KINGDOM KNOWLEDGE SYSTEM
          </div>
        </div>
        <div className="cinzel md:hidden" style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>
          KLS
        </div>
        <div className="flex-wrap sm:flex-nowrap" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              width: 30,
              height: 30,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <div
            className="hidden sm:flex"
            style={{
              color: "var(--text-secondary)",
              cursor: "pointer",
              alignItems: "center",
            }}
          >
            <Search size={18} />
          </div>
          <div style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
              <Bell size={18} />
            </span>
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "var(--red)",
                color: "white",
                width: 14,
                height: 14,
                borderRadius: "50%",
                fontSize: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              3
            </span>
          </div>
          <a
            href="/dashboard/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--purple), var(--teal))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "white",
              }}
            >
              {user ? user.firstName[0] : "G"}
            </div>
            <div className="hidden md:block">
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {user ? `${user.firstName} ${user.lastName}` : "Guest User"}
              </div>
              <div style={{ fontSize: 10, color: "var(--gold)" }}>
                {user ? user.roleName : "Not signed in"}
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Nav links */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          padding: "0 12px",
          gap: 2,
          scrollbarWidth: "none",
        }}
      >
        {topLinks.map((link) => {
          const Tag = link.href ? "a" : "button";
          return (
            <Tag
              key={link.label}
              href={link.href}
              aria-label={link.href ? link.label : `${link.label} (coming soon)`}
              aria-disabled={link.href ? undefined : true}
              title={link.href ? undefined : "Coming soon"}
              style={{
                background: "none",
                border: "none",
                cursor: link.href ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 10px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                borderBottom: "2px solid transparent",
                textDecoration: "none",
                opacity: link.href ? 1 : 0.55,
                transition: "color 0.15s, border-color 0.15s",
                fontSize: 11,
              }}
              onMouseEnter={(e) => {
                if (!link.href) return;
                (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                (e.currentTarget as HTMLElement).style.borderBottomColor =
                  "var(--gold)";
              }}
              onMouseLeave={(e) => {
                if (!link.href) return;
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.borderBottomColor =
                  "transparent";
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>{link.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 11 }}>{link.label}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
                  {link.sub}
                </div>
              </div>
            </Tag>
          );
        })}
      </div>
    </header>
  );
}
