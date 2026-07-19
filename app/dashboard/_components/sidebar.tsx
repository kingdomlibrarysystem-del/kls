"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { roleViewRoute, type SwitchableRole } from "@/lib/role-switcher";
import { BookCopy, ChevronDown, ChevronLeft } from "lucide-react";
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
  const { user, switchRole } = useAuth();
  const isMember = user?.role === "member";
  const mainNav = isMember ? memberNav : adminMainNav;
  const mgmtNav = isMember ? [] : adminMgmtNav;
  const currentRoute = usePathname();

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isSectionActive = (item: NavItem) =>
    !!item.subItems?.some((sub) => currentRoute.startsWith(sub.href));

  const handleSwitchRole = (role: SwitchableRole) => {
    switchRole(role);
    window.location.href = roleViewRoute[role];
  };

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
        {mgmtNav.map((item) => (
          <SidebarNavItem key={item.label} item={item} collapsed={collapsed} currentRoute={currentRoute} />
        ))}

        {!collapsed && <SidebarFooter currentRole={user?.role} onSwitchRole={handleSwitchRole} />}
      </div>
    </aside>
  );
}
