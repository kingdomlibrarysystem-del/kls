'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Headphones, PlayCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import type { CareResourceItem } from '@/lib/care/data'

const KIND = {
  ARTICLE: { label: 'Read', icon: BookOpen },
  AUDIO: { label: 'Listen', icon: Headphones },
  VIDEO: { label: 'Watch', icon: PlayCircle },
} as const
const PROGRAM = { COUNSELING: 'Counseling', REHABILITATION: 'Recovery', GENERAL: 'Wellbeing' } as const

/** Filterable grid of care resources: type (read / listen / watch), programme, topic and search. */
export function ResourcesBrowser({ resources }: { resources: CareResourceItem[] }) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<'all' | keyof typeof KIND>('all')
  const [topic, setTopic] = useState('all')
  const topics = useMemo(() => [...new Set(resources.map((r) => r.topic))].sort(), [resources])

  const visible = resources.filter((r) =>
    (kind === 'all' || r.kind === kind) &&
    (topic === 'all' || r.topic === topic) &&
    (!q.trim() || `${r.title} ${r.summary} ${r.topic}`.toLowerCase().includes(q.trim().toLowerCase())))

  if (resources.length === 0) {
    return <p className="rounded-xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">Readings and recordings will appear here soon. In the meantime you can <Link href="/member/care/counseling" className="font-semibold text-primary underline">talk to a counselor</Link>.</p>
  }

  const chip = (active: boolean) => cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground')

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search readings and recordings…" className="h-10 pl-9" aria-label="Search" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(kind === 'all')} onClick={() => setKind('all')} aria-pressed={kind === 'all'}>All</button>
        {(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => (
          <button key={k} type="button" className={chip(kind === k)} onClick={() => setKind(k)} aria-pressed={kind === k}>{KIND[k].label}</button>
        ))}
        {topics.length > 1 && (
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic"
            className="h-8 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="all">All topics</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">Nothing matches — try another word or filter.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => {
            const K = KIND[r.kind]
            return (
              <Link key={r.id} href={`/member/care/resources/${r.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/20 to-card">
                  <RemoteImage src={r.coverImage} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-primary"><K.icon className="size-10" /></div>} />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold text-foreground"><K.icon className="size-3.5" /> {K.label}</span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{PROGRAM[r.program]} · {r.topic}</p>
                  <p className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">{r.title}</p>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{r.summary}</p>
                  {r.durationMins && <p className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted-foreground"><Clock className="size-3.5" /> {r.durationMins} min</p>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
