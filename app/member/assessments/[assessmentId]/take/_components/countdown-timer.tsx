'use client'

import { useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  secondsRemaining: number
  onTick: (nextSeconds: number) => void
  onExpire: () => void
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Mock countdown timer for timed exams (per kls-product-spec Task 6.5 —
 * quizzes are not timed). Announces remaining time via an `aria-live`
 * region and calls `onExpire` once when it reaches zero.
 */
export function CountdownTimer({ secondsRemaining, onTick, onExpire }: CountdownTimerProps) {
  const expiredRef = useRef(false)

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
      return
    }
    const interval = setInterval(() => onTick(secondsRemaining - 1), 1000)
    return () => clearInterval(interval)
  }, [secondsRemaining, onTick, onExpire])

  const isLow = secondsRemaining <= 10

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(secondsRemaining)}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: isLow ? 'var(--red-dim)' : 'var(--bg-section)',
        color: isLow ? 'var(--red-light)' : 'var(--text-primary)',
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      <Clock size={15} />
      {formatTime(secondsRemaining)}
    </div>
  )
}
