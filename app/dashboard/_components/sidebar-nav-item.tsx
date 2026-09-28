"use client";
import { useState } from "react";
import type { NavItem } from "./nav-data";

/** Single non-expandable sidebar link, used for both top-level items without `subItems` and Platform Management entries. */
export function SidebarNavItem({ item, collapsed, currentRoute }: { item: NavItem; collapsed: boolean; currentRoute: string }) {
  const [hovered, setHovered] = useState(false);
  const isActive = item.active || (item.href && currentRoute.startsWith(item.href));

  return (
    <a
      href={item.href || "#"}
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
        boxShadow: isActive ? "inset 2px 0 0 var(--gold)" : "none",
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
    </a>
  );
}
