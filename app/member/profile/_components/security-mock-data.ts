/** A real login event, from the real LoginHistory collection (per APP_DOC Task 1.7) — see use-login-history.ts. */
export interface LoginEvent {
  id: string
  date: string
  ip: string
  device: string
  success: boolean
}
