/** A member's own reservation record. */
export type ReservationStatus = 'Ready' | 'Waiting' | 'Fulfilled'

export interface Reservation {
  id: number
  title: string
  author: string
  reserved: string
  status: ReservationStatus
  queue?: number
  fulfilled?: string
}

export const mockReservations: Reservation[] = [
  { id: 1, title: 'The Spirit of Leadership', author: 'Dr. Elias Nkubito', reserved: 'Jun 20, 2026', status: 'Ready', queue: 0 },
  { id: 2, title: 'Maximizing Your Potential', author: 'Dr. Elias Nkubito', reserved: 'Jun 18, 2026', status: 'Waiting', queue: 2 },
  { id: 3, title: 'In Pursuit of Purpose', author: 'Dr. Elias Nkubito', reserved: 'Jun 15, 2026', status: 'Waiting', queue: 5 },
  { id: 4, title: 'Kingdom Principles', author: 'Dr. Elias Nkubito', reserved: 'Jun 10, 2026', status: 'Fulfilled', fulfilled: 'Jun 12, 2026' },
]
