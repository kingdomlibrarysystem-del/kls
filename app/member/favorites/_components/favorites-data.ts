/** A favorited item can be a digital library resource or an e-learning course. */
export type FavoriteType = 'RESOURCE' | 'COURSE'

export interface FavoriteItem {
  id: string
  type: FavoriteType
  title: string
  subtitle: string
}

/** Mock favorites for the signed-in member. */
export const initialFavorites: FavoriteItem[] = [
  { id: 'fav-001', type: 'RESOURCE', title: 'The Pursuit of Knowledge', subtitle: 'E-Book · Philosophy' },
  { id: 'fav-002', type: 'COURSE', title: 'Kingdom Foundations', subtitle: 'Course · 12 lessons' },
  { id: 'fav-003', type: 'RESOURCE', title: 'World History Essentials', subtitle: 'E-Book · History' },
  { id: 'fav-004', type: 'COURSE', title: 'The Art of Worship', subtitle: 'Course · 8 lessons' },
]
