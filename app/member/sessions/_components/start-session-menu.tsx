'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CalendarPlus, Link2, ChevronDown } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useEnrollments } from '@/app/member/_shared/use-enrollments'
import { useCourses, type CatalogCourse } from '@/app/member/_shared/use-courses'
import { startInstantSession } from '@/lib/sessions/use-session-requests'
import { InviteLinkModal } from '@/components/session-room/invite-link-modal'
import { RequestSessionModal } from '@/app/member/courses/_components/request-session-modal'

/**
 * Meet-style 3-way choice for the member side, symmetric to the
 * lecturer's StartSessionMenu — "Start now" / "Schedule for later" /
 * "Get invite link". Schedule reuses the existing RequestSessionModal
 * (the same component /member/courses uses) rather than a second
 * scheduling form. Invite creates the same INSTANT session as Start Now
 * but shows the real room link first, matching Meet's own flow.
 */
export function StartSessionMenu() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: enrollments } = useEnrollments()
  const { data: courseCatalog } = useCourses()
  const myCourses = enrollments
    .map((e) => courseCatalog.find((c) => c.id === e.courseId))
    .filter((c): c is CatalogCourse => !!c)
  const [menuOpen, setMenuOpen] = useState(false)
  const [instantOpen, setInstantOpen] = useState(false)
  const [scheduleCourse, setScheduleCourse] = useState<CatalogCourse | null>(null)
  const [inviteHref, setInviteHref] = useState<string | null>(null)
  const [courseId, setCourseId] = useState(myCourses[0]?.id ?? '')
  const [instantError, setInstantError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (myCourses.length === 0) return null

  const startInstant = async (thenInvite: boolean) => {
    setInstantError('')
    const course = myCourses.find((c) => c.id === courseId) ?? myCourses[0]
    if (!user) return
    if (!course.lecturerId) { setInstantError('This course has no assigned lecturer.'); return }
    try {
      const created = await startInstantSession({
        learnerId: user.id,
        lecturerId: course.lecturerId,
        courseId: course.id,
      })
      const href = `/member/sessions/${created.id}/room`
      setInstantOpen(false)
      if (thenInvite) setInviteHref(href)
      else router.push(href)
    } catch (err) {
      setInstantError(err instanceof Error ? err.message : 'Could not start this session')
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Start or schedule a session"
        aria-expanded={menuOpen}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
      >
        <Zap size={16} /> New Session <ChevronDown size={14} />
      </button>

      {menuOpen && (
        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, width: 220, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <MenuItem icon={<Zap size={16} />} label="Start now" onClick={() => { setMenuOpen(false); setInstantError(''); setInstantOpen(true) }} />
          <MenuItem icon={<CalendarPlus size={16} />} label="Schedule for later" onClick={() => { setMenuOpen(false); setScheduleCourse(myCourses.find((c) => c.id === courseId) ?? myCourses[0]) }} />
          <MenuItem icon={<Link2 size={16} />} label="Get invite link" onClick={() => { setMenuOpen(false); setInstantError(''); setInstantOpen(true) }} />
        </div>
      )}

      <Modal open={instantOpen} onClose={() => setInstantOpen(false)} title="Start an Instant Session" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Starts a live session with your lecturer right now — no scheduling or approval step, same as Meet&apos;s
            &ldquo;Start an instant meeting.&rdquo;
          </p>
          {instantError && (
            <div style={{ background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
              {instantError}
            </div>
          )}
          <div>
            <FieldLabel htmlFor="instant-course" required>Course</FieldLabel>
            <select
              id="instant-course"
              value={courseId}
              onChange={(e) => { setCourseId(e.target.value); setInstantError('') }}
              className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
            >
              {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title} — {c.instructor}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
            <ElegantButton type="button" variant="outline" onClick={() => setInstantOpen(false)}>Cancel</ElegantButton>
            <ElegantButton type="button" variant="outline" onClick={() => startInstant(true)}>Get Link Instead</ElegantButton>
            <ElegantButton type="button" variant="primary" onClick={() => startInstant(false)}>Start Now</ElegantButton>
          </div>
        </div>
      </Modal>

      <RequestSessionModal course={scheduleCourse} onClose={() => setScheduleCourse(null)} availableCourses={myCourses} />

      {inviteHref && (
        <InviteLinkModal open onClose={() => setInviteHref(null)} roomHref={inviteHref} />
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-black/5"
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
    >
      {icon} {label}
    </button>
  )
}
