'use client'

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/ui/markdown-editor'

export interface DraftChapter {
  title: string
  body: string
}

interface ChaptersEditorProps {
  chapters: DraftChapter[]
  onChange: (chapters: DraftChapter[]) => void
  /** Site language code of the book (spell-check language of the editor). */
  language: string
}

/**
 * Writing the book chapter by chapter, with the same rich Markdown editor the
 * library's own book form uses (headings, images, colours, spell-check). Each
 * chapter becomes a real library chapter when the book is approved.
 */
export function ChaptersEditor({ chapters, onChange, language }: ChaptersEditorProps) {
  const update = (i: number, patch: Partial<DraftChapter>) => onChange(chapters.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const move = (i: number, by: -1 | 1) => {
    const next = [...chapters]
    const [item] = next.splice(i, 1)
    next.splice(i + by, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Chapters</Label>
        <p className="text-xs text-muted-foreground">Write the book here, one chapter at a time. Members read it in the library&apos;s reader after approval.</p>
      </div>

      {chapters.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">No chapters yet — add the first one.</p>
      )}

      {chapters.map((c, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-primary">Chapter {i + 1}</span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move chapter ${i + 1} up`}><ChevronUp /></Button>
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === chapters.length - 1} onClick={() => move(i, 1)} aria-label={`Move chapter ${i + 1} down`}><ChevronDown /></Button>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onChange(chapters.filter((_, j) => j !== i))} aria-label={`Remove chapter ${i + 1}`}>
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
          <Input value={c.title} onChange={(e) => update(i, { title: e.target.value })} maxLength={200} placeholder={`Chapter title, e.g. Chapter ${i + 1}`} aria-label={`Title of chapter ${i + 1}`} />
          <MarkdownEditor value={c.body} onChange={(body: string) => update(i, { body })} height={280} language={language.toUpperCase()} />
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...chapters, { title: '', body: '' }])}>
        <Plus /> Add Chapter
      </Button>
    </div>
  )
}
