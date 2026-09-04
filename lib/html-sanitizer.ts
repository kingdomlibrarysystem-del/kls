import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML produced by the rich-text editor (TipTap) before
 * persistence or rendering. Only permits safe structural and inline
 * formatting tags; strips scripts, event handlers, and dangerous
 * attributes. Works identically on server (Node) and client (browser)
 * via isomorphic-dompurify.
 */
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'del',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote',
  'pre', 'code',
  'span',
  'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'style',
  'class',
]

/**
 * Sanitize HTML — safe to call both server-side (persistence) and
 * client-side (render). Returns a string of safe HTML or empty string.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Allow inline styles (needed for font-family, font-size, text-align)
    // while stripping javascript: URLs and event handlers
    ALLOWED_URI_REGEXP: /^(?:(?:https|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  })
}
