/** A single canned semantic-search result, per APP_DOC Task 8.1 (intelligent search). */
export interface SearchResult {
  id: string
  title: string
  type: 'Resource' | 'Publication' | 'Research Paper'
  snippet: string
}

/** Static canned results returned for any search query — not a live search. */
export const cannedSearchResults: SearchResult[] = [
  { id: 'sr-001', title: 'Walking in Covenant', type: 'Publication', snippet: 'A study of covenant relationship and what it means to walk faithfully within it…' },
  { id: 'sr-002', title: 'The Pursuit of Knowledge', type: 'Resource', snippet: 'A deep dive into philosophical inquiry, examining how humanity has chased understanding…' },
  { id: 'sr-003', title: 'Faith and Resilience in Rural Communities', type: 'Research Paper', snippet: 'Exploring how digital tools shape discipleship and community life in rural congregations…' },
]

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

/** Keyword → canned reply, per APP_DOC Task 8.3 (chatbot informs only, never performs write actions). */
const cannedReplies: { keywords: string[]; reply: string }[] = [
  { keywords: ['borrow', 'borrowing', 'loan'], reply: 'To borrow a resource, open its detail page and select "Borrow." Standard loans run for 14 days and can be renewed if no one else has reserved the item.' },
  { keywords: ['reserve', 'reservation'], reply: 'You can reserve a resource that\'s currently unavailable. You\'ll be notified when it\'s ready for pickup — reservations typically hold for 48 hours once available.' },
  { keywords: ['certificate', 'certification'], reply: 'Certificates are issued automatically once you complete all lessons and pass the final assessment in a course. You can verify any certificate\'s authenticity from its verification code.' },
  { keywords: ['course', 'enroll', 'enrollment'], reply: 'You can browse available courses from the E-Learning section and enroll directly. Your progress is tracked automatically as you complete lessons.' },
]

const fallbackReply = "I can help with questions about borrowing, reservations, courses, and certificates. This is a mocked assistant for preview purposes — it doesn't perform any actions on your account."

/** Looks up a canned reply by matching keywords in the user's message; falls back to a generic response. */
export function getCannedReply(message: string): string {
  const lower = message.toLowerCase()
  const match = cannedReplies.find((entry) => entry.keywords.some((k) => lower.includes(k)))
  return match?.reply ?? fallbackReply
}
