"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

const topLinks = [
  { icon: "↩️", label: "Borrow & Return", sub: "Books, Audio, Video" },
  { icon: "💾", label: "E-Resources", sub: "Digital Content" },
  { icon: "📰", label: "News & Newspapers", sub: "Latest Updates" },
  { icon: "🛒", label: "Sales & Store", sub: "Media, Books, Merch" },
  { icon: "📦", label: "Inventory", sub: "Manage Collection" },
  { icon: "👥", label: "Members", sub: "Manage Users" },
  { icon: "📊", label: "Reports", sub: "Analytics & Insights" },
  {
    icon: "🖨",
    label: "Publishing Services",
    sub: "Publish, Distribute, Impact.",
  },
  {
    icon: "🔬",
    label: "Research Services",
    sub: "Discover, Publish, Transform.",
  },
  { icon: "✨", label: "Beauty Services", sub: "Beauty, Wellness, Transform." },
  {
    icon: "🧠",
    label: "Consultation & Counseling",
    sub: "Care, Counsel, Restore.",
  },
];

export default function DashboardTopbar() {
  const { theme, toggleTheme } = useTheme();

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
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 52,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LanguageSwitcher />

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
              fontSize: 14,
            }}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <div
            style={{
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            🔍
          </div>
          <div style={{ position: "relative", cursor: "pointer" }}>
            <span style={{ fontSize: 16, color: "var(--text-secondary)" }}>
              🔔
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
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
              J
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                John Doe
              </div>
              <div style={{ fontSize: 10, color: "var(--gold)" }}>
                Kingdom Member
              </div>
            </div>
          </div>
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
        {topLinks.map((link) => (
          <button
            key={link.label}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 10px",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
              borderBottom: "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
              fontSize: 11,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--gold)";
              (e.currentTarget as HTMLElement).style.borderBottomColor =
                "var(--gold)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.borderBottomColor =
                "transparent";
            }}
          >
            <span>{link.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 11 }}>{link.label}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
                {link.sub}
              </div>
            </div>
          </button>
        ))}
      </div>
    </header>
  );
}
