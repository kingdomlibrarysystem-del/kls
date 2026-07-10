'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getLecturerStats } from './dashboard-data'

/** Simulated network delay before mock stats become visible. */
const LOAD_DELAY_MS = 400

/** Lecturer dashboard stat cards: courses, enrolled students, session requests, upcoming sessions. */
export function DashboardView() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Loading dashboard stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 64, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  const stats = getLecturerStats()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
            <s.icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
