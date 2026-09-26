"use client";
import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Number of matching pages, shown as a hint under the field. */
  resultCount: number;
  /** True when the query is fuzzy — nothing matched, closest pages are shown. */
  fuzzy: boolean;
  /** Enter opens the best match. */
  onSubmit: () => void;
}

/**
 * Search field pinned above the sidebar nav list. Typing filters the nav down
 * to the related pages, so the long dashboard menu can be reached by name
 * instead of by scrolling.
 */
export function SidebarSearch({ value, onChange, resultCount, fuzzy, onSubmit }: SidebarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the field from anywhere in the dashboard, like a command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
      <div
        className="kcs-sidebar-search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 9,
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onChange("");
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="Search pages…"
          aria-label="Search dashboard pages"
          style={{
            flex: 1,
            minWidth: 0,
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: 12.5,
            lineHeight: 1.4,
            padding: 0,
          }}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            style={{
              display: "flex",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X size={13} />
          </button>
        ) : (
          <kbd
            style={{
              fontSize: 10,
              fontFamily: "inherit",
              color: "var(--text-muted)",
              background: "var(--bg-section)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "1px 5px",
              lineHeight: 1.4,
            }}
          >
            /
          </kbd>
        )}
      </div>
      {value.trim() && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 7, letterSpacing: 0.2 }}>
          {resultCount} related page{resultCount === 1 ? "" : "s"}
          {fuzzy ? " — closest matches" : ""}
        </div>
      )}
    </div>
  );
}
