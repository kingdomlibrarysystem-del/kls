"use client";
import { useRef, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BookCopy, ChevronDown, ChevronLeft, User, LogOut, Mail, ExternalLink } from "lucide-react";
import { adminMainNav, adminMgmtNav, memberNav, type NavItem } from "./nav-data";
import { SidebarNavItem } from "./sidebar-nav-item";
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
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const isMember = user?.role === "member";
  const mainNav = isMember ? memberNav : adminMainNav;
  const mgmtNav = isMember ? [] : adminMgmtNav;
  const currentRoute = usePathname();

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

  const isSectionActive = (item: NavItem) =>
    !!item.subItems?.some((sub) => currentRoute.startsWith(sub.href));

  return (
    <aside
      style={{
        width: collapsed ? 56 : 200,
        minWidth: collapsed ? 56 : 200,
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
          }}
        >
          <BookCopy size={20} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div className="cinzel" style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", lineHeight: 1.2 }}>
              KINGDOM
            </div>
            <div className="cinzel" style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", lineHeight: 1.2 }}>
              LIBRARY
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1 }}>
              {isMember ? "MEMBER PORTAL" : "KCS SYSTEM"}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 0" }}>
        {mainNav.map((item) => {
          const sectionActive = item.subItems ? isSectionActive(item) : false;
          const sectionExpanded = item.subItems ? expandedSections[item.label] || sectionActive : false;
          return item.subItems && !collapsed ? (
            <div key={item.label}>
              <div
                onClick={() => toggleSection(item.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  color: sectionExpanded || sectionActive ? "var(--gold)" : "var(--text-secondary)",
                  borderLeft: sectionActive ? "2px solid var(--gold)" : "2px solid transparent",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => {
                  if (!sectionExpanded && !sectionActive) e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 18 }}>{item.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                {sectionExpanded ? <ChevronDown size={12} /> : <ChevronLeft size={12} />}
              </div>
              {sectionExpanded && item.subItems.map((sub) => (
                <a
                  key={sub.label}
                  href={sub.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 12px 5px 32px",
                    textDecoration: "none",
                    fontSize: 11,
                    color: currentRoute.startsWith(sub.href) ? "var(--gold)" : "var(--text-secondary)",
                    background: currentRoute.startsWith(sub.href) ? "rgba(212,168,67,0.08)" : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!currentRoute.startsWith(sub.href)) e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { if (!currentRoute.startsWith(sub.href)) e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  {sub.icon}
                  <span>{sub.label}</span>
                </a>
              ))}
            </div>
          ) : (
            <SidebarNavItem key={item.label} item={item} collapsed={collapsed} currentRoute={currentRoute} />
          );
        })}

        {mgmtNav.length > 0 && !collapsed && (
          <div style={{ padding: "12px 12px 4px", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5 }}>
            PLATFORM MANAGEMENT
          </div>
        )}
        {mgmtNav.map((item) => {
          if (item.subItems && !collapsed) {
            const sectionActive = isSectionActive(item)
            const sectionExpanded = expandedSections[item.label] || sectionActive
            return (
              <div key={item.label}>
                <div
                  onClick={() => toggleSection(item.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: sectionExpanded || sectionActive ? "var(--gold)" : "var(--text-secondary)",
                    borderLeft: sectionActive ? "2px solid var(--gold)" : "2px solid transparent",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) => {
                    if (!sectionExpanded && !sectionActive) e.currentTarget.style.color = "var(--text-secondary)"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 18 }}>{item.icon}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                  {sectionExpanded ? <ChevronDown size={12} /> : <ChevronLeft size={12} />}
                </div>
                {sectionExpanded && item.subItems.map((sub) => (
                  <a
                    key={sub.label}
                    href={sub.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 12px 5px 32px",
                      textDecoration: "none",
                      fontSize: 11,
                      color: currentRoute.startsWith(sub.href) ? "var(--gold)" : "var(--text-secondary)",
                      background: currentRoute.startsWith(sub.href) ? "rgba(212,168,67,0.08)" : "transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!currentRoute.startsWith(sub.href)) e.currentTarget.style.color = "var(--text-primary)" }}
                    onMouseLeave={(e) => { if (!currentRoute.startsWith(sub.href)) e.currentTarget.style.color = "var(--text-secondary)" }}
                  >
                    {sub.icon}
                    <span>{sub.label}</span>
                  </a>
                ))}
              </div>
            )
          }
          return <SidebarNavItem key={item.label} item={item} collapsed={collapsed} currentRoute={currentRoute} />
        })}

        {!collapsed && <SidebarFooter />}
      </div>

      {/* User profile widget — pinned at bottom */}
      <div
        ref={profileRef}
        style={{
          borderTop: "1px solid var(--border)",
          padding: collapsed ? "10px 8px" : "10px 12px",
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
            gap: 8,
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              minWidth: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--purple), var(--teal))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {user?.firstName?.[0] ?? "G"}
          </div>
          {!collapsed && (
            <div style={{ textAlign: "left", minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </div>
              <div style={{ fontSize: 10, color: "var(--gold)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
              left: collapsed ? 56 : 12,
              minWidth: 200,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
              overflow: "hidden",
              zIndex: 50,
            }}
          >
            {/* Email row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                fontSize: 11,
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Mail size={13} />
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
                gap: 8,
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              <User size={13} /> My Profile <ExternalLink size={11} style={{ marginLeft: "auto", opacity: 0.5 }} />
            </a>
            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                fontSize: 12,
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
