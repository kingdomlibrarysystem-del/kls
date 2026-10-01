/**
 * Types + limits shared by the news engagement API, server loaders and the
 * client article component. Kept free of Prisma so client code can import it.
 */
/** Max comment length — enforced by the API (zod) and shown in the composer. */
export const COMMENT_MAX_LENGTH = 2000

export type ReactionType = 'LIKE' | 'DISLIKE'

export interface ArticleComment {
  id: string
  userId: string
  authorName: string
  body: string
  status: 'VISIBLE' | 'HIDDEN'
  createdAt: string
}

export interface ArticleEngagement {
  likes: number
  dislikes: number
  /** The viewer's own reaction, null when signed out or not reacted. */
  myReaction: ReactionType | null
  /** Visible comments, newest first. */
  comments: ArticleComment[]
}
