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
  Tag,
  Stethoscope,
  CalendarCheck,
  Syringe,
  Building2,
  FileText,
  Palette,
  Scissors,
  Star,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Target,
  Receipt,
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
  { icon: <LayoutDashboard size={16} />, label: "Dashboard", href: "/dashboard", active: true },
  {
    icon: <BookOpen size={16} />, label: "Digital Library",
    subItems: [
      { icon: <BookCopy size={14} />,   label: "Book Inventory",     href: "/dashboard/library" },
      { icon: <Map size={14} />,        label: "KCS Map",            href: "/dashboard/library/kcs" },
      { icon: <RotateCcw size={14} />,  label: "Borrow & Return",    href: "/dashboard/library/borrowings" },
      { icon: <Bookmark size={14} />,   label: "Reservations",       href: "/dashboard/reservations" },
      { icon: <ShoppingCart size={14} />, label: "Sales & Rentals",  href: "/dashboard/library/sales" },
      { icon: <BarChart3 size={14} />,  label: "Borrow Reports",     href: "/dashboard/library/reports" },
    ],
  },
  { icon: <Bot size={16} />, label: "AI & Tools", href: "/dashboard/ai" },
  {
    icon: <GraduationCap size={16} />, label: "E-Learning",
    subItems: [
      { icon: <BookOpen size={14} />,     label: "Overview",        href: "/dashboard/e-learning" },
      { icon: <BookCopy size={14} />,     label: "Course Catalog",  href: "/dashboard/e-learning/catalog" },
      { icon: <Tag size={14} />,          label: "Categories",      href: "/dashboard/e-learning/categories" },
      { icon: <Video size={14} />,        label: "Lessons",         href: "/dashboard/e-learning/lessons" },
      { icon: <ClipboardCheck size={14} />, label: "Quizzes & Exams", href: "/dashboard/e-learning/quizzes" },
      { icon: <ClipboardList size={14} />, label: "Enrollments",    href: "/dashboard/e-learning/enrollments" },
      { icon: <BarChart3 size={14} />,    label: "Progress",        href: "/dashboard/e-learning/progress" },
      { icon: <BookCopy size={14} />,     label: "Certificates",    href: "/dashboard/e-learning/certificates" },
      { icon: <Video size={14} />,        label: "Live Sessions",   href: "/dashboard/e-learning/sessions" },
    ],
  },
  {
    icon: <BookCopy size={16} />, label: "Publishing",
    subItems: [
      { icon: <ScrollText size={14} />, label: "Submissions",       href: "/dashboard/publishing" },
      { icon: <ClipboardList size={14} />, label: "Review Queue",   href: "/dashboard/publishing/review" },
      { icon: <BarChart3 size={14} />,  label: "Revenue & Royalties", href: "/dashboard/publishing/revenue" },
      { icon: <BookOpen size={14} />,   label: "Published Catalog", href: "/dashboard/publishing/catalog" },
    ],
  },
  {
    icon: <Search size={16} />, label: "Research",
    subItems: [
      { icon: <FolderOpen size={14} />,   label: "Projects",        href: "/dashboard/research" },
      { icon: <ScrollText size={14} />,   label: "Submit Paper",    href: "/dashboard/research/submit" },
      { icon: <Database size={14} />,     label: "Repository",      href: "/dashboard/research/repository" },
      { icon: <Users size={14} />,        label: "Collaborations",  href: "/dashboard/research/collaborations" },
    ],
  },
  {
    icon: <HeartPulse size={16} />, label: "Health System",
    subItems: [
      { icon: <Stethoscope size={14} />,   label: "Overview",        href: "/dashboard/health" },
      { icon: <CalendarCheck size={14} />, label: "Book a Checkup",  href: "/dashboard/health/checkups" },
      { icon: <FileText size={14} />,      label: "Health Records",  href: "/dashboard/health/records" },
      { icon: <Syringe size={14} />,       label: "Immunizations",   href: "/dashboard/health/immunizations" },
      { icon: <Building2 size={14} />,     label: "Clinic Directory", href: "/dashboard/health/clinics" },
      { icon: <ClipboardCheck size={14} />, label: "Admin: Appointments", href: "/dashboard/health/appointments" },
    ],
  },
  {
    icon: <Sparkles size={16} />, label: "Beauty Services",
    subItems: [
      { icon: <Sparkles size={14} />,      label: "Overview",     href: "/dashboard/beauty" },
      { icon: <Palette size={14} />,       label: "Providers",    href: "/dashboard/beauty/providers" },
      { icon: <Scissors size={14} />,      label: "Services",     href: "/dashboard/beauty/services" },
      { icon: <CalendarCheck size={14} />, label: "Appointments", href: "/dashboard/beauty/appointments" },
      { icon: <Star size={14} />,          label: "Admin: Bookings", href: "/dashboard/beauty/admin" },
    ],
  },
  {
    icon: <Brain size={16} />, label: "Consultation & Counseling",
    subItems: [
      { icon: <Brain size={14} />,         label: "Overview",        href: "/dashboard/counseling" },
      { icon: <Users size={14} />,         label: "Counselors",      href: "/dashboard/counseling/counselors" },
      { icon: <CalendarCheck size={14} />, label: "Sessions",        href: "/dashboard/counseling/sessions" },
      { icon: <MessageCircle size={14} />, label: "Session History", href: "/dashboard/counseling/history" },
      { icon: <ShieldCheck size={14} />,   label: "Admin: Sessions", href: "/dashboard/counseling/admin" },
    ],
  },
  {
    icon: <RefreshCcw size={16} />, label: "Rehabilitation",
    subItems: [
      { icon: <RefreshCcw size={14} />,    label: "Overview",        href: "/dashboard/rehabilitation" },
      { icon: <ClipboardList size={14} />, label: "Intake",          href: "/dashboard/rehabilitation/intake" },
      { icon: <CalendarCheck size={14} />, label: "Schedule",        href: "/dashboard/rehabilitation/schedule" },
      { icon: <TrendingUp size={14} />,    label: "Progress",        href: "/dashboard/rehabilitation/progress" },
      { icon: <Users size={14} />,         label: "Support Groups",  href: "/dashboard/rehabilitation/groups" },
      { icon: <ClipboardCheck size={14} />, label: "Admin: Intake",  href: "/dashboard/rehabilitation/admin/intake" },
      { icon: <CalendarCheck size={14} />, label: "Admin: Schedule", href: "/dashboard/rehabilitation/admin/schedule" },
    ],
  },
  { icon: <Download size={16} />,   label: "Download Center",          href: "/dashboard/downloads" },
];

/** "Platform Management" section — admin/staff only, rendered below `adminMainNav`. */
export const adminMgmtNav: NavItem[] = [
  { icon: <Users size={16} />,    label: "Members",           href: "/dashboard/users" },
  {
    icon: <Newspaper size={16} />, label: "News & Newspapers",
    subItems: [
      { icon: <Newspaper size={14} />,     label: "Overview",     href: "/dashboard/news" },
      { icon: <ScrollText size={14} />,    label: "Articles",     href: "/dashboard/news/articles" },
      { icon: <ClipboardList size={14} />, label: "Review Queue", href: "/dashboard/news/review" },
      { icon: <BookOpen size={14} />,      label: "Editions",     href: "/dashboard/news/editions" },
      { icon: <Mail size={14} />,          label: "Subscribers",  href: "/dashboard/news/subscribers" },
      { icon: <Tag size={14} />,           label: "Categories",   href: "/dashboard/news/categories" },
    ],
  },
  {
    icon: <Gift size={16} />, label: "Donations",
    subItems: [
      { icon: <Target size={14} />,  label: "Overview",  href: "/dashboard/donations" },
      { icon: <Gift size={14} />,    label: "Campaigns", href: "/dashboard/donations/campaigns" },
      { icon: <Receipt size={14} />, label: "History",   href: "/dashboard/donations/history" },
    ],
  },
  { icon: <BarChart3 size={16} />, label: "Reports & Analytics", href: "/dashboard/reports" },
  { icon: <Shield size={16} />,   label: "Roles & Permissions", href: "/dashboard/roles" },
  { icon: <Bell size={16} />,     label: "Notifications",       href: "/dashboard/notifications" },
  { icon: <MessageSquare size={16} />, label: "Messages",       href: "/dashboard/messages" },
  { icon: <Mail size={16} />,     label: "Invitations",         href: "/dashboard/invitations" },
  { icon: <Settings size={16} />, label: "System Settings",     href: "/dashboard/settings" },
  { icon: <ScrollText size={16} />, label: "Audit Log",         href: "/dashboard/audit-log" },
];

/** Member-role nav — note this intentionally points at `/dashboard/*` routes, a pre-existing inconsistency (see CLAUDE.md) left as-is here. */
export const memberNav: NavItem[] = [
  { icon: <Home size={16} />, label: "Dashboard", href: "/member", active: true },
  { icon: <BookOpen size={16} />, label: "Library", href: "/dashboard/library" },
  { icon: <GraduationCap size={16} />, label: "E-Learning", href: "/dashboard/e-learning" },
  { icon: <RotateCcw size={16} />, label: "My Borrowings", href: "/dashboard/library/borrowings" },
  { icon: <Clock size={16} />, label: "Reservations", href: "/dashboard/reservations" },
  { icon: <Heart size={16} />, label: "Favorites", href: "/member/favorites" },
  { icon: <User size={16} />, label: "Profile", href: "/dashboard/profile" },
];
