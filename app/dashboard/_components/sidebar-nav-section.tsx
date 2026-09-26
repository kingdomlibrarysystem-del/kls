"use client";
import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import type { NavItem } from "./nav-data";
import { SidebarNavItem } from "./sidebar-nav-item";

interface SidebarNavSectionProps {
  item: NavItem;
  currentRoute: string;
  expanded: boolean;
  onToggle: () => void;
}

interface SidebarNavRowProps {
  item: NavItem;
  collapsed: boolean;
  currentRoute: string;
  expandedSections: Record<string, boolean>;
  onToggle: (label: string) => void;
}

/**
 * One entry of a nav group: the collapsible section when the item has children
 * (auto-expanded while you are inside it), otherwise a plain link row.
 */
export function SidebarNavRow({ item, collapsed, currentRoute, expandedSections, onToggle }: SidebarNavRowProps) {
  if (!item.subItems?.length || collapsed) {
    return <SidebarNavItem item={item} collapsed={collapsed} currentRoute={currentRoute} />;
  }

  const sectionActive = item.subItems.some((sub) => currentRoute.startsWith(sub.href));
  return (
    <SidebarNavSection
      item={item}
      currentRoute={currentRoute}
      expanded={!!expandedSections[item.label] || sectionActive}
      onToggle={() => onToggle(item.label)}
    />
  );
}

/**
 * One collapsible nav section: the header row with its icon, label and
 * chevron, plus the indented sub-items. Shared by the main and Platform
 * Management loops so both read identically.
 */
export function SidebarNavSection({ item, currentRoute, expanded, onToggle }: SidebarNavSectionProps) {
  const [hovered, setHovered] = useState(false);
  const subItems = item.subItems ?? [];
  const sectionActive = subItems.some((sub) => currentRoute.startsWith(sub.href));

  return (
    <div style={{ marginBottom: 2 }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "0 8px",
          padding: "8px 10px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 0.1,
          color: sectionActive || expanded ? "var(--gold)" : "var(--text-primary)",
          background: sectionActive ? "var(--gold-tint)" : hovered ? "var(--bg-hover)" : "transparent",
          borderRadius: 8,
          boxShadow: sectionActive ? "inset 2px 0 0 var(--gold)" : "none",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 18, flexShrink: 0 }}>
          {item.icon}
        </span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.label}
        </span>
        <span style={{ display: "flex", color: sectionActive ? "var(--gold)" : "var(--text-muted)", flexShrink: 0 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
        </span>
      </div>

      {expanded && (
        <div style={{ margin: "2px 0 4px", paddingLeft: 17, marginLeft: 18, borderLeft: "1px solid var(--border)" }}>
          {subItems.map((sub) => (
            <SidebarSubLink key={sub.href} href={sub.href} label={sub.label} icon={sub.icon} currentRoute={currentRoute} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Nested destination row — a gold pill when it is the page you are on. */
function SidebarSubLink({
  href,
  label,
  icon,
  currentRoute,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  currentRoute: string;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = currentRoute.startsWith(href);

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        margin: "1px 8px",
        padding: "7px 10px",
        textDecoration: "none",
        fontSize: 12,
        lineHeight: 1.35,
        color: isActive ? "var(--gold)" : "var(--text-secondary)",
        background: isActive ? "var(--gold-tint)" : hovered ? "var(--bg-hover)" : "transparent",
        borderRadius: 7,
        fontWeight: isActive ? 600 : 400,
        transition: "background 0.15s, color 0.15s",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 16, flexShrink: 0, opacity: isActive ? 1 : 0.75 }}>
        {icon}
      </span>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </a>
  );
}
