'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CalendarPlus, Link2, ChevronDown } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { ElegantButton } from '@/components/ui/elegant-button'
import { LECTURER_NAME, lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { startInstantSession } from '@/app/lecturer/_shared/use-session-requests'
import { InviteLinkModal } from '@/components/session-room/invite-link-modal'
import { ScheduleSessionModal } from './schedule-session-modal'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

/**
 * Meet-style 3-way choice — "Start now" / "Schedule for later" /
 * "Get invite link" — replacing the single "Start Instant Session"
 * button. Schedule reuses the existing SCHEDULED requestSession() flow
 * (ScheduleSessionModal); Invite creates the same INSTANT session as
 * Start Now but shows the real room link first instead of navigating
 * straight in, matching Meet's own "Your meeting's ready" step.
 */
export function StartSessionMenu() {
  const router = useRouter()
  const lecturer = lecturerRoster.find((l) => l.name === LECTURER_NAME)
  const myCourses = courseCatalog.filter((c) => c.lecturerId === lecturer?.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const [instantOpen, setInstantOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [inviteHref, setInviteHref] = useState<string | null>(null)
  const [courseId, setCourseId] = useState(myCourses[0]?.id ?? '')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (myCourses.length === 0) return null

  const startInstant = (thenInvite: boolean) => {
    const course = myCourses.find((c) => c.id === courseId) ?? myCourses[0]
    const created = startInstantSession({
      learnerName: CURRENT_MEMBER_NAME,
      lecturerName: LECTURER_NAME,
      courseId: course.id,
      courseTitle: course.title,
    })
    const href = `/lecturer/sessions/${created.id}/room`
    setInstantOpen(false)
    if (thenInvite) setInviteHref(href)
    else router.push(href)
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Start or schedule a session"
        aria-expanded={menuOpen}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        <Zap size={14} /> New Session <ChevronDown size={12} />
      </button>

      {menuOpen && (
        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, width: 220, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <MenuItem icon={<Zap size={14} />} label="Start now" onClick={() => { setMenuOpen(false); setInstantOpen(true) }} />
          <MenuItem icon={<CalendarPlus size={14} />} label="Schedule for later" onClick={() => { setMenuOpen(false); setScheduleOpen(true) }} />
          <MenuItem icon={<Link2 size={14} />} label="Get invite link" onClick={() => { setMenuOpen(false); setInstantOpen(true) }} />
        </div>
      )}

      <Modal open={instantOpen} onClose={() => setInstantOpen(false)} title="Start an Instant Session" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {`Starts a live session with ${CURRENT_MEMBER_NAME} right now — no scheduling or approval step, same as Meet's "Start an instant meeting."`}
          </p>
          <div>
            <FieldLabel htmlFor="instant-course" required>Course</FieldLabel>
            <select
              id="instant-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-3 font-lato text-sm border rounded border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600 focus:outline-none"
            >
              {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
            <ElegantButton type="button" variant="outline" onClick={() => setInstantOpen(false)}>Cancel</ElegantButton>
            <ElegantButton type="button" variant="outline" onClick={() => startInstant(true)}>Get Link Instead</ElegantButton>
            <ElegantButton type="button" variant="primary" onClick={() => startInstant(false)}>Start Now</ElegantButton>
          </div>
        </div>
      </Modal>

      <ScheduleSessionModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} courses={myCourses} />

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
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
    >
      {icon} {label}
    </button>
  )
}
