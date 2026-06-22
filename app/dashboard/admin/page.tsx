import Link from 'next/link'
import { BookOpen, Bookmark, CalendarClock, GraduationCap, FlaskConical, BookCopy, Bell } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const stats = [
  { label: 'Active Borrowings',  value: '2', sub: 'resources borrowed',        color: 'text-green-600' },
  { label: 'Reservations',       value: '1', sub: 'waiting in queue',           color: 'text-blue-600'  },
  { label: 'Enrolled Courses',   value: '0', sub: 'e-learning courses',         color: 'text-purple-600'},
  { label: 'Overdue Items',      value: '0', sub: 'need to be returned',        color: 'text-red-600'   },
]

const modules = [
  {
    icon: <BookOpen size={22} className="text-w-600" />,
    title: 'Digital Library',
    desc: 'Browse, borrow, and reserve books, eBooks, journals, audio and video resources.',
    href: '/dashboard/library',
    badge: null,
  },
  {
    icon: <Bookmark size={22} className="text-w-600" />,
    title: 'My Borrowings',
    desc: 'View active borrowings, renew items, and track due dates.',
    href: '/dashboard/borrowings',
    badge: '2 active',
  },
  {
    icon: <CalendarClock size={22} className="text-w-600" />,
    title: 'Reservations',
    desc: 'Manage your resource reservation queue and claim available items.',
    href: '/dashboard/reservations',
    badge: '1 ready',
  },
  {
    icon: <GraduationCap size={22} className="text-w-600" />,
    title: 'E-Learning',
    desc: 'Enroll in courses, complete lessons, take quizzes, and earn certificates.',
    href: '/dashboard/e-learning',
    badge: 'Coming Soon',
  },
  {
    icon: <BookCopy size={22} className="text-w-600" />,
    title: 'Publishing',
    desc: 'Submit manuscripts for review, track approval status, and manage royalties.',
    href: '/dashboard/publishing',
    badge: 'Coming Soon',
  },
  {
    icon: <FlaskConical size={22} className="text-w-600" />,
    title: 'Research',
    desc: 'Create research projects, submit papers, and discover resources.',
    href: '/dashboard/research',
    badge: 'Coming Soon',
  },
]

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Welcome Back" subtitle="Your Kingdom Library Dashboard" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-5">
            <p className="font-lato text-xs text-w-700 mb-1">{s.label}</p>
            <p className={`font-cinzel text-3xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
            <p className="font-lato text-xs text-w-600">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Notification banner */}
      <Link href="/dashboard/notifications">
        <div className="flex items-center gap-3 bg-w-100 border border-w-300 rounded-lg px-5 py-3 mb-8 hover:border-w-600 transition-colors">
          <Bell size={16} className="text-w-600 shrink-0" />
          <p className="font-lato text-sm text-w-950">
            You have <span className="font-semibold text-w-600">2 unread notifications</span> — a borrow was approved and a book is due soon.
          </p>
        </div>
      </Link>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link key={m.href} href={m.href}>
            <div className="bg-white border border-w-300 rounded-lg p-5 hover:border-w-600 hover:shadow-md transition-all h-full flex flex-col gap-3">
              <div className="flex items-center justify-between">
                {m.icon}
                {m.badge && (
                  <span className={`px-2 py-0.5 rounded text-xs font-lato font-semibold ${
                    m.badge === 'Coming Soon' ? 'bg-w-100 text-w-700' : 'bg-green-100 text-green-800'
                  }`}>
                    {m.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="font-cinzel text-sm font-semibold text-w-950 mb-1">{m.title}</p>
                <p className="font-lato text-xs text-w-700 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
