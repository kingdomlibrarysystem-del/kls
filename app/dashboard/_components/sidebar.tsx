"use client";
import { useState } from "react";

const mainNav = [
  { icon: "⊞", label: "Dashboard", active: true },
  { icon: "🗺", label: "KCS Map" },
  { icon: "📚", label: "Digital Library" },
  { icon: "🤖", label: "AI & Tools" },
  { icon: "🎓", label: "E-Learning" },
  { icon: "🏥", label: "Health System" },
  { icon: "✨", label: "Beauty Services", isNew: true },
  { icon: "🧠", label: "Consultation & Counseling", isNew: true },
  { icon: "♻️", label: "Rehabilitation", isNew: true },
  { icon: "🛎", label: "Services Services", isNew: true },
  { icon: "📦", label: "Resources" },
  { icon: "🔧", label: "Kingdom Tools" },
  { icon: "⬇️", label: "Download Center" },
];

const mgmtNav = [
  { icon: "↩️", label: "Borrow & Return" },
  { icon: "💾", label: "E-Resources" },
  { icon: "📋", label: "Inventory" },
  { icon: "👥", label: "Members" },
  { icon: "🗂", label: "Cataloging" },
  { icon: "📊", label: "Reports & Analytics" },
  { icon: "📰", label: "News & Newspapers" },
  { icon: "🛒", label: "Sales & Store" },
  { icon: "🎁", label: "Donations" },
];

const langList = [
  { flag: "🇬🇧", label: "English", value: "en" },
  { flag: "🇫🇷", label: "Français", value: "fr" },
  { flag: "🇷🇼", label: "Kinyarwanda", value: "rw" },
];

function triggerGoogleTranslate(lang: string) {
  document.cookie = `googtrans=/en/${lang}; path=/; max-age=31536000; SameSite=Lax`

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo")
  if (select) {
    select.value = lang
    select.dispatchEvent(new Event("change", { bubbles: true }))
  }

  setTimeout(() => window.location.reload(), 100)
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 56 : 200,
        minWidth: collapsed ? 56 : 200,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        transition: "width 0.2s",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "16px 12px",
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
            width: 40,
            height: 40,
            minWidth: 40,
            background: "linear-gradient(135deg, var(--gold-dim), var(--gold))",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          📖
        </div>
        {!collapsed && (
          <div>
            <div
              className="cinzel"
              style={{
                fontSize: 11,
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
                fontSize: 11,
                fontWeight: 700,
                color: "var(--gold)",
                lineHeight: 1.2,
              }}
            >
              LIBRARY
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--text-muted)",
                letterSpacing: 1,
              }}
            >
              KCS SYSTEM
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* Main Nav */}
        {mainNav.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} />
        ))}

        {/* Library Management */}
        {!collapsed && (
          <div
            style={{
              padding: "12px 12px 4px",
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: 1.5,
            }}
          >
            LIBRARY MANAGEMENT
          </div>
        )}
        {mgmtNav.map((item) => (
          <NavItem key={item.label} item={item} collapsed={collapsed} />
        ))}

        {/* Languages */}
        {!collapsed && (
          <>
            <div
              style={{
                padding: "12px 12px 4px",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: 1.5,
              }}
            >
              LANGUAGES
            </div>
            {langList.map((lang) => (
              <div
                key={lang.value}
                onClick={() => triggerGoogleTranslate(lang.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--gold)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-secondary)")
                }
              >
                <span style={{ fontSize: 14 }}>{lang.flag}</span>
                {lang.label}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

function NavItem({ item, collapsed }: { item: any; collapsed: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 12,
        background: item.active
          ? "rgba(212,168,67,0.12)"
          : hovered
            ? "var(--bg-hover)"
            : "transparent",
        borderLeft: item.active
          ? "2px solid var(--gold)"
          : "2px solid transparent",
        color: item.active
          ? "var(--gold)"
          : hovered
            ? "var(--text-primary)"
            : "var(--text-secondary)",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 14, minWidth: 18 }}>{item.icon}</span>
      {!collapsed && (
        <span
          style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {item.label}
        </span>
      )}
    </div>
  );
}
