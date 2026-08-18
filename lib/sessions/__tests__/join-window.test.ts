import { describe, it, expect } from 'vitest'
import { getJoinWindowState, JOIN_WINDOW_EARLY_MIN, JOIN_WINDOW_LATE_GRACE_MIN } from '../join-window'

const NOW = new Date('2026-08-16T12:00:00.000Z')

describe('getJoinWindowState', () => {
  it('always allows joining an INSTANT session, regardless of scheduledAt', () => {
    expect(getJoinWindowState({ mode: 'INSTANT', scheduledAt: undefined }, NOW)).toEqual({ canJoin: true })
    expect(getJoinWindowState({ mode: 'INSTANT', scheduledAt: '2026-08-16T18:00:00.000Z' }, NOW)).toEqual({ canJoin: true })
  })

  it('always allows joining a SCHEDULED request with no scheduledAt yet (still PENDING)', () => {
    expect(getJoinWindowState({ mode: 'SCHEDULED', scheduledAt: undefined }, NOW)).toEqual({ canJoin: true })
  })

  it('blocks joining more than the early window before scheduledAt', () => {
    const scheduledAt = new Date(NOW.getTime() + (JOIN_WINDOW_EARLY_MIN + 1) * 60_000).toISOString()
    const result = getJoinWindowState({ mode: 'SCHEDULED', scheduledAt }, NOW)
    expect(result).toMatchObject({ canJoin: false, reason: 'too-early' })
  })

  it('allows joining exactly at the start of the early window', () => {
    const scheduledAt = new Date(NOW.getTime() + JOIN_WINDOW_EARLY_MIN * 60_000).toISOString()
    expect(getJoinWindowState({ mode: 'SCHEDULED', scheduledAt }, NOW)).toEqual({ canJoin: true })
  })

  it('allows joining right up to the scheduled time and shortly after', () => {
    const scheduledAt = NOW.toISOString()
    expect(getJoinWindowState({ mode: 'SCHEDULED', scheduledAt }, NOW)).toEqual({ canJoin: true })

    const justAfter = new Date(NOW.getTime() + 5 * 60_000)
    expect(getJoinWindowState({ mode: 'SCHEDULED', scheduledAt }, justAfter)).toEqual({ canJoin: true })
  })

  it('blocks joining after the late grace period has passed', () => {
    const scheduledAt = new Date(NOW.getTime() - (JOIN_WINDOW_LATE_GRACE_MIN + 1) * 60_000).toISOString()
    const result = getJoinWindowState({ mode: 'SCHEDULED', scheduledAt }, NOW)
    expect(result).toEqual({ canJoin: false, reason: 'too-late' })
  })

  it('allows joining exactly at the edge of the late grace period', () => {
    const scheduledAt = new Date(NOW.getTime() - JOIN_WINDOW_LATE_GRACE_MIN * 60_000).toISOString()
    expect(getJoinWindowState({ mode: 'SCHEDULED', scheduledAt }, NOW)).toEqual({ canJoin: true })
  })
})
