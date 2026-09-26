"use client";
import type { MouseEvent } from "react";
import { CornerDownLeft } from "lucide-react";
import { highlightParts, type NavSearchHit } from "./nav-search";

interface SidebarSearchResultsProps {
  hits: NavSearchHit[];
  query: string;
  currentRoute: string;
  /** Clears the query after navigation so the full nav comes back. */
  onNavigate: () => void;
  /** Opens a result (top-of-list shortcut button). */
  onOpenHit: (href: string) => void;
}

/**
 * Flat replacement for the nested nav tree while a search is active: every
 * related page as a single row, with its section as a breadcrumb so repeated
 * labels like "Overview" stay distinguishable.
 */
export function SidebarSearchResults({ hits, query, currentRoute, onNavigate, onOpenHit }: SidebarSearchResultsProps) {
  if (!hits.length) return null;

  return (
    <div style={{ padding: "6px 0 10px" }}>
      {hits.map((hit) => {
        const isActive = currentRoute.startsWith(hit.href);
        return (
          <a
            key={`${hit.section}/${hit.label}`}
            href={hit.href}
            onClick={onNavigate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              margin: "1px 8px",
              padding: "8px 10px",
              textDecoration: "none",
              fontSize: 12.5,
              lineHeight: 1.35,
              borderRadius: 7,
              color: isActive ? "var(--gold)" : "var(--text-secondary)",
              background: isActive ? "var(--gold-tint)" : "transparent",
              boxShadow: isActive ? "inset 2px 0 0 var(--gold)" : "none",
            }}
            onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
              if (!isActive) e.currentTarget.style.background = "var(--bg-hover)";
              if (!isActive) e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 16, flexShrink: 0 }}>
              {hit.icon}
            </span>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {highlightParts(hit.label, query).map((part, i) => (
                <span key={i} style={part.match ? { color: "var(--gold)", fontWeight: 700 } : undefined}>
                  {part.text}
                </span>
              ))}
            </span>
            {hit.section && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 92,
                  flexShrink: 0,
                }}
                title={hit.section}
              >
                {hit.section}
              </span>
            )}
          </a>
        );
      })}

  
    </div>
  );
}
