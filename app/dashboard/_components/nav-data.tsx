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
  Bookmark,
  Search,
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
  Shield,
  MessageSquare,
} from "lucide-react";

/** One flyout entry nested under a top-level nav section (e.g. "Book Inventory" under "Digital Library"). */
export type SubItem = { icon: React.ReactNode; label: string; href: string };

/** One top-level sidebar/nav entry — either a direct link or a section with `subItems`. */
export type NavItem = {
  icon: React.ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  subItems?: SubItem[];
};

/**
 * Shared nav structure for admin/staff roles — the single source of truth for
 * both the desktop `Sidebar` and the mobile bottom nav's "More" overflow menu,
 * so the two never drift out of sync.
 */
export const adminMainNav: NavItem[] = [
  { icon: <LayoutDashboard size={14} />, label: "Dashboard", href: "/dashboard", active: true },
  { icon: <Map size={14} />, label: "KCS Map", href: "/dashboard/kcs" },
  {
    icon: <BookOpen size={14} />, label: "Digital Library",
    subItems: [
      { icon: <BookCopy size={12} />,   label: "Book Inventory",     href: "/dashboard/library" },
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
      { icon: <BookOpen size={12} />,     label: "Overview",        href: "/dashboard/e-learning" },
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

/** "Platform Management" section — admin/staff only, rendered below `adminMainNav`. */
export const adminMgmtNav: NavItem[] = [
  { icon: <Users size={14} />,    label: "Members",           href: "/dashboard/users" },
  { icon: <Newspaper size={14} />, label: "News & Newspapers", href: "/dashboard/news" },
  { icon: <Gift size={14} />,     label: "Donations",          href: "/dashboard/donations" },
  { icon: <BarChart3 size={14} />, label: "Reports & Analytics", href: "/dashboard/reports" },
  { icon: <Shield size={14} />,   label: "Roles & Permissions", href: "/dashboard/roles" },
  { icon: <Bell size={14} />,     label: "Notifications",       href: "/dashboard/notifications" },
  { icon: <MessageSquare size={14} />, label: "Messages",       href: "/dashboard/messages" },
  { icon: <Mail size={14} />,     label: "Invitations",         href: "/dashboard/invitations" },
  { icon: <Settings size={14} />, label: "System Settings",     href: "/dashboard/settings" },
  { icon: <ScrollText size={14} />, label: "Audit Log",         href: "/dashboard/audit-log" },
];

/** Member-role nav — note this intentionally points at `/dashboard/*` routes, a pre-existing inconsistency (see CLAUDE.md) left as-is here. */
export const memberNav: NavItem[] = [
  { icon: <Home size={14} />, label: "Dashboard", href: "/member", active: true },
  { icon: <BookOpen size={14} />, label: "Library", href: "/dashboard/library" },
  { icon: <GraduationCap size={14} />, label: "E-Learning", href: "/dashboard/e-learning" },
  { icon: <RotateCcw size={14} />, label: "My Borrowings", href: "/dashboard/library/borrowings" },
  { icon: <Clock size={14} />, label: "Reservations", href: "/dashboard/reservations" },
  { icon: <Heart size={14} />, label: "Favorites", href: "/member/favorites" },
  { icon: <User size={14} />, label: "Profile", href: "/dashboard/profile" },
];
