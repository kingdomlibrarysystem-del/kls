'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { claimCountdown } from './reservations-data'

export function QueueBadge({ position }: { position: number }) {
  const colors = ['bg-w-600 text-white', 'bg-w-400 text-w-950', 'bg-w-200 text-w-950']
  const cls = colors[position - 1] ?? 'bg-w-100 text-w-700'
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-cinzel font-bold ${cls}`}>#{position}</span>
}

/** Live-updating countdown to a reservation's claim deadline, re-rendering every minute. */
export function ClaimCountdown({ deadline }: { deadline: string }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])
  const { label, urgent } = claimCountdown(deadline)
  return (
    <span className={`flex items-center gap-1 text-xs font-lato font-semibold ${urgent ? 'text-red-700' : 'text-yellow-700'}`}>
      <Clock size={11} /> {label}
    </span>
  )
}
