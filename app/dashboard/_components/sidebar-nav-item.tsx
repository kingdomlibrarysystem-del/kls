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
        gap: 8,
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 12,
        textDecoration: "none",
        background: isActive
          ? "rgba(212,168,67,0.12)"
          : hovered
            ? "var(--bg-hover)"
            : "transparent",
        borderLeft: isActive
          ? "2px solid var(--gold)"
          : "2px solid transparent",
        color: isActive
          ? "var(--gold)"
          : hovered
            ? "var(--text-primary)"
            : "var(--text-secondary)",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 18 }}>{item.icon}</span>
      {!collapsed && (
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label}
        </span>
      )}
    </a>
  );
}
