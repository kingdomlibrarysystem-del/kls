/** Mock recovery codes for 2FA, per APP_DOC Task 1.5. Static — not regenerated. */
export const mockRecoveryCodes: string[] = [
  'KLS-8F2A-11QX', 'KLS-3D9C-77TZ', 'KLS-5B1E-42WV',
  'KLS-9A6F-08YR', 'KLS-2C4D-95NP', 'KLS-7E3B-63MK',
]

/** Mock active session, per APP_DOC Task 1.6 (session tracking). */
export interface SessionEntry {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

export const mockSessions: SessionEntry[] = [
  { id: 'sess-001', device: 'Chrome on Windows', location: 'Kigali, Rwanda', lastActive: '2026-06-28 09:12', current: true },
  { id: 'sess-002', device: 'Safari on iPhone',  location: 'Kigali, Rwanda', lastActive: '2026-06-27 21:40', current: false },
]

/** Mock login event, per APP_DOC Task 1.7 (login history). */
export interface LoginEvent {
  id: string
  date: string
  ip: string
  device: string
  success: boolean
}

export const mockLoginHistory: LoginEvent[] = [
  { id: 'log-001', date: '2026-06-28 09:12', ip: '105.235.140.22', device: 'Chrome on Windows', success: true },
  { id: 'log-002', date: '2026-06-27 21:40', ip: '105.235.141.87', device: 'Safari on iPhone',  success: true },
  { id: 'log-003', date: '2026-06-25 08:03', ip: '41.186.20.11',   device: 'Chrome on Windows', success: false },
]
