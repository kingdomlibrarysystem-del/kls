'use client'

import { motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  /** Tailwind utility classes forwarded to the wrapping motion.div. */
  className?: string
}

/**
 * Short fade + slight-slide entrance for a page or top-level section, powered
 * by framer-motion. Intended to replace ad-hoc use of the `.slide-from-left`/
 * `.slide-from-right` CSS classes on *new* pages going forward — existing
 * usages of those classes are left untouched. Duration is 200ms to match the
 * codebase's snappy (150–300ms) transition feel.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
