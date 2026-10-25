import Link from 'next/link'
import { ArrowRight, BookHeart, CalendarClock, HeartHandshake, Headphones, MessageCircle, Phone, ShieldCheck, Sprout, Video } from 'lucide-react'
import prisma from '@/prisma/client'
import { requirePageAuth } from '@/lib/server/page-session'
import { listPublishedResources } from '@/lib/care/data'
import { LocalDate } from '@/components/ui/local-date'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Care & Support hub. Three ways to get help, plus what's coming up for the
 * member (next confirmed session) — loaded on the server in parallel.
 */
export default async function CareHomePage() {
  const session = await requirePageAuth()
  const [resources, nextSession, pending, groups] = await Promise.all([
    listPublishedResources(),
    prisma.counselingSession.findFirst({ where: { userId: session.userId, status: 'CONFIRMED', proposedTime: { gte: new Date() } }, orderBy: { proposedTime: 'asc' }, include: { counselor: { select: { name: true } } } }),
    prisma.counselingSession.count({ where: { userId: session.userId, status: 'PENDING' } }),
    prisma.rehabGroupMember.count({ where: { userId: session.userId } }),
  ])
  const latest = resources.slice(0, 3)

  const ways = [
    { href: '/member/care/resources', icon: BookHeart, title: 'Read & listen', body: 'Short readings, audio and videos on faith, hope, family, grief, stress and recovery.', cta: `${resources.length} resource${resources.length === 1 ? '' : 's'}`, tone: 'from-primary/15' },
    { href: '/member/care/counseling', icon: HeartHandshake, title: 'Talk to someone', body: 'Book a confidential session with a counselor — by phone, video call or in person — or send them a message.', cta: pending > 0 ? `${pending} request${pending === 1 ? '' : 's'} waiting` : 'Book a session', tone: 'from-info/15' },
    { href: '/member/care/rehabilitation', icon: Sprout, title: 'Recovery programme', body: 'A guided programme with a plan, regular sessions, support groups and milestones along the way.', cta: groups > 0 ? `In ${groups} group${groups === 1 ? '' : 's'}` : 'Start here', tone: 'from-success/15' },
  ]

  return (
    <div className="space-y-6">
      {nextSession && (
        <Link href="/member/care/counseling" className="flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CalendarClock className="size-6 text-success" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-foreground">Your next session with {nextSession.counselor.name}</p>
            <p className="text-muted-foreground">
              <LocalDate value={nextSession.proposedTime.toISOString()} mode="datetime" options={{ weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }} />
              {' · '}{nextSession.mode === 'PHONE' ? 'Phone call' : nextSession.mode === 'VIRTUAL' ? 'Video call' : 'In person'}
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {ways.map(({ href, icon: Icon, title, body, cta, tone }) => (
          <Link key={href} href={href} className={cn('group flex flex-col rounded-xl border border-border bg-gradient-to-br to-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md', tone)}>
            <span className="flex size-10 items-center justify-center rounded-lg bg-card text-primary shadow-xs"><Icon className="size-5" /></span>
            <h2 className="mt-3 font-cinzel text-base font-bold text-foreground">{title}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">{cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-bold text-foreground">How you can be helped</h2>
        <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Phone, t: 'Phone call', d: 'A counselor calls you at the time you choose.' },
            { icon: Video, t: 'Video call', d: 'Meet online — you receive the link when it is confirmed.' },
            { icon: MessageCircle, t: 'Messages', d: 'Write to your counselor any time in Messages.' },
            { icon: Headphones, t: 'Listen & read', d: 'Encouragement you can open whenever you need it.' },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex gap-2.5"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block font-medium text-foreground">{t}</span><span className="text-muted-foreground">{d}</span></span></li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" /> What you share is confidential and only seen by the people helping you. If you are in immediate danger, call 112 (Rwanda emergency) or go to the nearest health centre.</p>
      </section>

      {latest.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-cinzel text-lg font-bold text-foreground">New to read & listen</h2>
            <Link href="/member/care/resources" className={buttonVariants({ variant: 'outline', size: 'sm' })}>See all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {latest.map((r) => (
              <Link key={r.id} href={`/member/care/resources/${r.id}`} className="rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/50">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{r.kind === 'AUDIO' ? 'Listen' : r.kind === 'VIDEO' ? 'Watch' : 'Read'} · {r.topic}</p>
                <p className="mt-1 line-clamp-2 font-semibold text-foreground">{r.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
