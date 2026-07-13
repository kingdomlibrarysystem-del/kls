'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
}

/**
 * Minimal multi-value tag input — no such component exists elsewhere in
 * this codebase yet (confirmed via search), so this is a small, new
 * primitive: type a tag, press Enter or comma to add it as a chip,
 * click the × to remove one. Kept intentionally simple (no autocomplete,
 * no drag-reorder) to match the complexity level of this app's other
 * custom form inputs rather than over-building a new UI pattern.
 */
export function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const commitDraft = () => {
    const tag = draft.trim().toLowerCase()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitDraft()
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag))

  return (
    <div className="w-full px-3 py-2 font-lato text-sm border border-w-500 bg-form-bg rounded focus-within:border-w-600 flex flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-w-100 text-w-700 rounded text-xs">
          #{tag}
          <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`} className="hover:text-w-950">
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? 'Type a tag and press Enter…' : ''}
        aria-label="Add a tag"
        className="flex-1 min-w-[100px] outline-none bg-transparent"
      />
    </div>
  )
}
