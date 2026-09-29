"use client";
import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "./nav-data";
import { routeMatches } from "./route-match";

/** Single non-expandable sidebar link, used for both top-level items without `subItems` and Platform Management entries. */
export function SidebarNavItem({ item, collapsed, currentRoute }: { item: NavItem; collapsed: boolean; currentRoute: string }) {
  const [hovered, setHovered] = useState(false);
  // A section shown as a single icon (collapsed sidebar) is active when you are on any of its pages.
  const isActive = item.href
    ? routeMatches(currentRoute, item.href)
    : !!item.subItems?.some((sub) => routeMatches(currentRoute, sub.href));

  return (
    <Link
      href={item.href || item.subItems?.[0]?.href || "#"}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? "page" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "0 8px",
        padding: "8px 10px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 0.1,
        textDecoration: "none",
        background: isActive ? "var(--gold-tint)" : hovered ? "var(--bg-hover)" : "transparent",
        color: isActive ? "var(--gold)" : hovered ? "var(--text-primary)" : "var(--text-primary)",
        transition: "background 0.15s, color 0.15s",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 18, flexShrink: 0 }}>
        {item.icon}
      </span>
      {!collapsed && (
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label}
        </span>
      )}
    </Link>
  );
}
