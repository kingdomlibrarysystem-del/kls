"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BookCopy, User, LogOut, Mail, ExternalLink } from "lucide-react";
import { adminMainNav, adminMgmtNav, memberNav } from "./nav-data";
import { flattenNav, searchNav } from "./nav-search";
import { SidebarNavRow } from "./sidebar-nav-section";
import { SidebarSearch } from "./sidebar-search";
import { SidebarSearchResults } from "./sidebar-search-results";
import { SidebarFooter } from "./sidebar-footer";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Digital Library": true,
    "E-Learning": false,
    "Publishing": false,
    "Research": false,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const isMember = user?.role === "member";
  const mainNav = isMember ? memberNav : adminMainNav;
  const mgmtNav = useMemo(() => (isMember ? [] : adminMgmtNav), [isMember]);
  const currentRoute = usePathname();

  const searching = query.trim().length > 0;
  /** Flat page index for the search box, rebuilt only when the role's nav changes. */
  const searchEntries = useMemo(() => flattenNav([mainNav, mgmtNav]), [mainNav, mgmtNav]);
  const hits = useMemo(() => (searching ? searchNav(searchEntries, query) : []), [searching, searchEntries, query]);
  /** True when nothing matched outright and the list is showing nearest pages. */
  const fuzzy = hits.length > 0 && hits.every((hit) => hit.score <= 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    router.push("/");
  };

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  /** Opens a search result and restores the full nav behind it. */
  const openHit = (href: string) => {
    setQuery("");
    router.push(href);
  };

  return (
    <aside
      style={{
        width: collapsed ? 60 : 232,
        minWidth: collapsed ? 60 : 232,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100vh",
        overflow: "hidden",
        transition: "width 0.2s",
        position: "sticky",
        top: 0,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          padding: "16px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCollapsed(!collapsed);
          }
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            minWidth: 40,
            background: "linear-gradient(135deg, var(--gold-dim), var(--gold))",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px var(--gold-tint)",
          }}
        >
          <BookCopy size={21} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", lineHeight: 1.15, letterSpacing: 0.5 }}>
              KINGDOM
            </div>
            <div className="cinzel" style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", lineHeight: 1.15, letterSpacing: 0.5 }}>
              LIBRARY
            </div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: 1, marginTop: 2 }}>
              {isMember ? "MEMBER PORTAL" : "KCS SYSTEM"}
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <SidebarSearch
          value={query}
          onChange={setQuery}
          resultCount={hits.length}
          fuzzy={fuzzy}
          onSubmit={() => hits[0] && openHit(hits[0].href)}
        />
      )}

      <div className="kcs-sidebar-nav" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 0 12px" }}>
        {searching ? (
          <SidebarSearchResults
            hits={hits}
            query={query}
            currentRoute={currentRoute}
            onNavigate={() => setQuery("")}
            onOpenHit={openHit}
          />
        ) : (
          <>
            {mainNav.map((item) => (
              <SidebarNavRow
                key={item.label}
                item={item}
                collapsed={collapsed}
                currentRoute={currentRoute}
                expandedSections={expandedSections}
                onToggle={toggleSection}
              />
            ))}

            {mgmtNav.length > 0 && !collapsed && (
              <div className="kcs-sidebar-label" style={{ padding: "16px 18px 6px" }}>
                PLATFORM MANAGEMENT
              </div>
            )}
            {mgmtNav.map((item) => (
              <SidebarNavRow
                key={item.label}
                item={item}
                collapsed={collapsed}
                currentRoute={currentRoute}
                expandedSections={expandedSections}
                onToggle={toggleSection}
              />
            ))}

            {!collapsed && <SidebarFooter />}
          </>
        )}
      </div>

      {/* User profile widget — pinned at bottom */}
      <div
        ref={profileRef}
        style={{
          borderTop: "1px solid var(--border)",
          padding: collapsed ? "12px 10px" : "12px",
          position: "relative",
        }}
      >
        <button
          onClick={() => setProfileOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            width: "100%",
            background: profileOpen ? "var(--bg-hover)" : "none",
            border: "none",
            cursor: "pointer",
            padding: collapsed ? 0 : "6px 8px",
            borderRadius: 9,
            transition: "background 0.15s",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              minWidth: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--gold-dim), var(--gold))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              boxShadow: "0 1px 4px var(--gold-tint)",
            }}
          >
            {user?.firstName?.[0] ?? "G"}
          </div>
          {!collapsed && (
            <div style={{ textAlign: "left", minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </div>
              <div style={{ fontSize: 11, color: "var(--gold)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.roleName ?? "Not signed in"}
              </div>
            </div>
          )}
        </button>

        {profileOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: collapsed ? 60 : 12,
              minWidth: 224,
              background: "var(--bg-card)",
              border: "1px solid var(--border-gold)",
              borderRadius: 10,
              boxShadow: "0 -6px 28px rgba(0,0,0,0.18)",
              overflow: "hidden",
              zIndex: 50,
            }}
          >
            {/* Email row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "12px 14px",
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              <Mail size={14} color="var(--gold)" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email ?? "—"}
              </span>
            </div>
            {/* Profile link */}
            <a
              href="/dashboard/profile"
              onClick={() => setProfileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "11px 14px",
                fontSize: 13,
                color: "var(--text-primary)",
                textDecoration: "none",
                borderTop: "1px solid var(--border)",
              }}
            >
              <User size={14} /> My Profile <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />
            </a>
            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "11px 14px",
                fontSize: 13,
                color: "var(--red)",
                background: "none",
                border: "none",
                borderTop: "1px solid var(--border)",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <LogOut size={13} /> Log Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
