"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { SWITCHABLE_ROLES, roleViewLabel, roleViewRoute } from "@/lib/role-switcher";
import {
  LayoutDashboard,
  Map,
  BookOpen,
  Bot,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Brain,
  RefreshCcw,
  Bell,
  BarChart3,
  Newspaper,
  ShoppingCart,
  Gift,
  Home,
  Heart,
  Clock,
  User,
  Shield,
  Bookmark,
  Search,
  ChevronDown,
  ChevronLeft,
  ScrollText,
  BookCopy,
  RotateCcw,
  Database,
  ClipboardList,
  ClipboardCheck,
  Video,
  Users,
  FolderOpen,
  Download,
  Mail,
  Settings,
} from "lucide-react";

type SubItem = { icon: React.ReactNode; label: string; href: string }
type NavItem = {
  icon: React.ReactNode
  label: string
  href?: string
  active?: boolean
  subItems?: SubItem[]
}

const adminMainNav: NavItem[] = [
  { icon: <LayoutDashboard size={14} />, label: "Dashboard", href: "/dashboard", active: true },
  { icon: <Map size={14} />, label: "KCS Map", href: "/dashboard/kcs" },
  {
    icon: <BookOpen size={14} />, label: "Digital Library",
    subItems: [
      { icon: <BookCopy size={12} />,   label: "Book Inventory",     href: "/dashboard/library" },
      { icon: <FolderOpen size={12} />, label: "Categories",         href: "/dashboard/library/categories" },
      { icon: <RotateCcw size={12} />,  label: "Borrow & Return",    href: "/dashboard/library/borrowings" },
      { icon: <Bookmark size={12} />,   label: "Reservations",       href: "/dashboard/reservations" },
      { icon: <ShoppingCart size={12} />, label: "Sales & Rentals",  href: "/dashboard/library/sales" },
      { icon: <BarChart3 size={12} />,  label: "Borrow Reports",     href: "/dashboard/library/reports" },
    ],
  },
  { icon: <Bot size={14} />, label: "AI & Tools", href: "/dashboard/ai" },
  {
    icon: <GraduationCap size={14} />, label: "E-Learning",
    subItems: [
      { icon: <BookOpen size={12} />,     label: "Courses",         href: "/dashboard/e-learning" },
      { icon: <BookCopy size={12} />,     label: "Course Catalog",  href: "/dashboard/e-learning/catalog" },
      { icon: <ScrollText size={12} />,   label: "Add Course",      href: "/dashboard/e-learning/add" },
      { icon: <Video size={12} />,        label: "Lessons",         href: "/dashboard/e-learning/lessons" },
      { icon: <ClipboardCheck size={12} />, label: "Quizzes & Exams", href: "/dashboard/e-learning/quizzes" },
      { icon: <ClipboardList size={12} />, label: "Enrollments",    href: "/dashboard/e-learning/enrollments" },
      { icon: <BarChart3 size={12} />,    label: "Progress",        href: "/dashboard/e-learning/progress" },
      { icon: <BookCopy size={12} />,     label: "Certificates",    href: "/dashboard/e-learning/certificates" },
      { icon: <Video size={12} />,        label: "Live Sessions",   href: "/dashboard/e-learning/sessions" },
    ],
  },
  {
    icon: <BookCopy size={14} />, label: "Publishing",
    subItems: [
      { icon: <ScrollText size={12} />, label: "Submissions",       href: "/dashboard/publishing" },
      { icon: <ClipboardList size={12} />, label: "Review Queue",   href: "/dashboard/publishing/review" },
      { icon: <BarChart3 size={12} />,  label: "Revenue & Royalties", href: "/dashboard/publishing/revenue" },
      { icon: <BookOpen size={12} />,   label: "Published Catalog", href: "/dashboard/publishing/catalog" },
    ],
  },
  {
    icon: <Search size={14} />, label: "Research",
    subItems: [
      { icon: <FolderOpen size={12} />,   label: "Projects",        href: "/dashboard/research" },
      { icon: <ScrollText size={12} />,   label: "Submit Paper",    href: "/dashboard/research/submit" },
      { icon: <Database size={12} />,     label: "Repository",      href: "/dashboard/research/repository" },
      { icon: <Users size={12} />,        label: "Collaborations",  href: "/dashboard/research/collaborations" },
    ],
  },
  { icon: <HeartPulse size={14} />, label: "Health System",          href: "/dashboard/health" },
  { icon: <Sparkles size={14} />,   label: "Beauty Services",         href: "/dashboard/beauty" },
  { icon: <Brain size={14} />,      label: "Consultation & Counseling", href: "/dashboard/counseling" },
  { icon: <RefreshCcw size={14} />, label: "Rehabilitation",           href: "/dashboard/rehabilitation" },
  { icon: <Download size={14} />,   label: "Download Center",          href: "/dashboard/downloads" },
];

const adminMgmtNav: NavItem[] = [
  { icon: <Users size={14} />,    label: "Members",           href: "/dashboard/users" },
  { icon: <Newspaper size={14} />, label: "News & Newspapers", href: "/dashboard/news" },
  { icon: <Gift size={14} />,     label: "Donations",          href: "/dashboard/donations" },
  { icon: <BarChart3 size={14} />, label: "Reports & Analytics", href: "/dashboard/reports" },
  { icon: <Shield size={14} />,   label: "Roles & Permissions", href: "/dashboard/roles" },
  { icon: <Bell size={14} />,     label: "Notifications",       href: "/dashboard/notifications" },
  { icon: <Mail size={14} />,     label: "Invitations",         href: "/dashboard/invitations" },
  { icon: <Settings size={14} />, label: "System Settings",     href: "/dashboard/settings" },
  { icon: <ScrollText size={14} />, label: "Audit Log",         href: "/dashboard/audit-log" },
];

const memberNav: NavItem[] = [
  { icon: <Home size={14} />, label: "Dashboard", href: "/member", active: true },
  { icon: <BookOpen size={14} />, label: "Library", href: "/dashboard/library" },
  { icon: <GraduationCap size={14} />, label: "E-Learning", href: "/dashboard/e-learning" },
  { icon: <RotateCcw size={14} />, label: "My Borrowings", href: "/dashboard/library/borrowings" },
  { icon: <Clock size={14} />, label: "Reservations", href: "/dashboard/reservations" },
  { icon: <Heart size={14} />, label: "Favorites", href: "#" },
  { icon: <User size={14} />, label: "Profile", href: "/dashboard/profile" },
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

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
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

        {!collapsed && (
          <>
            <div style={{ padding: "12px 12px 4px", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5 }}>
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
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                <span style={{ fontSize: 14 }}>{lang.flag}</span>
                {lang.label}
              </div>
            ))}

            <div style={{ padding: "12px 12px 4px", fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5 }}>
              ROLE SIMULATION
            </div>
            {SWITCHABLE_ROLES.map((r) => (
              <div
                key={r}
                onClick={() => { switchRole(r); window.location.href = roleViewRoute[r]; }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px",
                  cursor: "pointer",
                  fontSize: 11,
                  color: user?.role === r ? "var(--gold)" : "var(--text-secondary)",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={(e) => {
                  if (user?.role !== r) e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <Shield size={12} />
                {roleViewLabel[r]}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

function SidebarNavItem({ item, collapsed, currentRoute }: { item: NavItem; collapsed: boolean; currentRoute: string }) {
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
