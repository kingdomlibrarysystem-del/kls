'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CloudinaryUploadField, type UploadKind } from '@/components/ui/cloudinary-upload-field'
import { RemoteImage } from '@/components/ui/remote-image'
import { mediaCapabilities, type MediaTypeOption } from '@/lib/media-types-shared'
import type { KcsCategoryOption, SerializedPublication } from '@/lib/data/publications'
import { ChaptersEditor, type DraftChapter } from './chapters-editor'

const selectCls = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'rw', label: 'Kinyarwanda' },
] as const

interface FormState {
  title: string
  author: string
  description: string
  categoryId: string
  language: string
  mediaType: string
  coverImage: string
  documentUrl: string
  audioUrl: string
  videoUrl: string
  pages: string
  price: string
  borrowPrice: string
  quantity: string
}

interface BookSubmissionFormProps {
  categories: KcsCategoryOption[]
  /** All KCS pillar names — to explain an empty list when pillars exist but have no scrolls. */
  pillarNames: string[]
  mediaTypes: MediaTypeOption[]
  /** The draft / rejected book being edited, or null for a new book. */
  initial: SerializedPublication | null
}

/**
 * A publisher's book form. "Save Draft" keeps it private; "Submit for Review"
 * sends it to the reviewers — members only see it after it is approved.
 * The category list is the KCS taxonomy (pillar → scroll) and the media type
 * list is admin-managed; the upload fields shown follow the media type.
 */
export function BookSubmissionForm({ categories, pillarNames, mediaTypes, initial }: BookSubmissionFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => ({
    title: initial?.title ?? '',
    author: initial?.author ?? '',
    description: initial?.description ?? '',
    categoryId: initial?.categoryId ?? '',
    language: initial?.language ?? 'en',
    mediaType: initial?.mediaType ?? mediaTypes[0]?.code ?? '',
    coverImage: initial?.coverImage ?? '',
    documentUrl: initial?.documentUrl ?? '',
    audioUrl: initial?.audioUrl ?? '',
    videoUrl: initial?.videoUrl ?? '',
    pages: initial?.pages ? String(initial.pages) : '',
    price: initial?.price !== undefined ? String(initial.price) : '0',
    borrowPrice: initial?.borrowPrice !== undefined ? String(initial.borrowPrice) : '0',
    quantity: initial?.quantity !== undefined ? String(initial.quantity) : '1',
  }))
  const [chapters, setChapters] = useState<DraftChapter[]>(() => initial?.chapters?.map((c) => ({ title: c.title, body: c.body })) ?? [])
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null)
  const [error, setError] = useState('')
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const caps = mediaCapabilities(form.mediaType, mediaTypes)
  const pillars = useMemo(() => {
    const groups = new Map<string, KcsCategoryOption[]>()
    for (const c of categories) {
      const key = c.pillarCode ? `${c.pillarCode} — ${c.pillar}` : c.pillar
      groups.set(key, [...(groups.get(key) ?? []), c])
    }
    return [...groups.entries()]
  }, [categories])

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v))

  const save = async (submit: boolean) => {
    setError('')
    if (form.title.trim().length < 2) { setError('Give the book a title'); return }
    setBusy(submit ? 'submit' : 'draft')
    const fields = {
      title: form.title.trim(),
      author: form.author.trim(),
      description: form.description.trim(),
      ...(form.categoryId && { categoryId: form.categoryId }),
      language: form.language,
      mediaType: form.mediaType,
      coverImage: form.coverImage,
      documentUrl: caps.allowsDocument ? form.documentUrl : '',
      audioUrl: caps.allowsAudio ? form.audioUrl : '',
      videoUrl: caps.allowsVideo ? form.videoUrl : '',
      chapters: caps.allowsChapters ? chapters : [],
      pages: num(form.pages),
      price: num(form.price) ?? 0,
      borrowPrice: num(form.borrowPrice) ?? 0,
      quantity: num(form.quantity) ?? 1,
    }
    try {
      const call = async (url: string, method: string, body: unknown) => {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const json = await res.json().catch(() => null)
        if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save the book')
        return json
      }
      if (initial) {
        await call(`/api/publications/${initial.id}`, 'PATCH', { action: 'update', fields })
        if (submit) await call(`/api/publications/${initial.id}`, 'PATCH', { action: 'submit' })
      } else {
        await call('/api/publications', 'POST', { ...fields, submit })
      }
      router.push(`/dashboard/publishing/my?done=${submit ? 'submitted' : 'saved'}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the book')
      setBusy(null)
    }
  }

  const upload = (key: 'documentUrl' | 'audioUrl' | 'videoUrl' | 'coverImage', kind: UploadKind, accept: string, label: string, onPages?: (n: number) => void) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pub-${key}`}>{label}</Label>
      <CloudinaryUploadField
        id={`pub-${key}`}
        kind={kind}
        accept={accept}
        label={`Upload ${label.toLowerCase()}`}
        value={form[key]}
        onUploaded={(r) => { set(key, r.url); if (onPages && typeof r.pages === 'number' && r.pages > 0) onPages(r.pages) }}
        onClear={() => set(key, '')}
      />
    </div>
  )

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(true) }} className="max-w-4xl space-y-6">
      {initial?.status === 'REJECTED' && initial.reviewNotes && (
        <div role="alert" className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <p className="font-semibold text-warning">Sent back by the reviewer</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{initial.reviewNotes}</p>
          <p className="mt-1 text-xs text-muted-foreground">Make the changes, then submit it again.</p>
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-bold tracking-wide text-foreground">The book</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pub-title">Title</Label>
            <Input id="pub-title" value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={200} placeholder="e.g. Walking in the Covenant" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pub-author">Author <span className="font-normal text-muted-foreground">(as printed on the book)</span></Label>
            <Input id="pub-author" value={form.author} onChange={(e) => set('author', e.target.value)} maxLength={120} placeholder="Leave empty to use your name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pub-language">Language</Label>
            <select id="pub-language" value={form.language} onChange={(e) => set('language', e.target.value)} className={selectCls}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pub-category">KCS category</Label>
            <select id="pub-category" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={selectCls}>
              <option value="">Choose the scroll this book belongs to…</option>
              {pillars.map(([pillar, items]) => (
                <optgroup key={pillar} label={pillar}>
                  {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-warning">
                {pillarNames.length > 0
                  ? <>Your KCS Map has {pillarNames.length === 1 ? 'the pillar' : 'the pillars'} <b>{pillarNames.join(', ')}</b> but no scrolls under {pillarNames.length === 1 ? 'it' : 'them'}. Books are filed under a scroll: in{' '}</>
                  : <>No KCS categories exist yet. In{' '}</>}
                <Link href="/dashboard/library/kcs" className="font-semibold underline">Digital Library → KCS Map</Link>
                {pillarNames.length > 0 ? ', add a category and choose its pillar as the Parent Category.' : ', create a pillar, then a scroll under it.'}
              </p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pub-description">Description</Label>
            <Textarea id="pub-description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} maxLength={5000} placeholder="What is the book about, and who is it for?" />
            <p className="text-right text-xs text-muted-foreground">{form.description.length}/5000</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-bold tracking-wide text-foreground">Cover and content</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          {upload('coverImage', 'image', 'image/*', 'Cover image')}
          <div className="relative h-36 w-full overflow-hidden rounded-lg border border-border bg-muted">
            <RemoteImage src={form.coverImage} alt="Cover preview" fill sizes="120px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-xs text-muted-foreground">No cover</div>} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pub-media">Media type</Label>
          <select id="pub-media" value={form.mediaType} onChange={(e) => set('mediaType', e.target.value)} className={selectCls}>
            {mediaTypes.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">
            {[
              caps.allowsChapters && 'write the chapters below',
              caps.allowsDocument && 'upload the PDF',
              caps.allowsAudio && 'upload the audio',
              caps.allowsVideo && 'upload the video',
            ].filter(Boolean).join(' or ').replace(/^./, (c) => c.toUpperCase()) || 'This media type has no content fields'}
            {' '}— at least one is needed to submit. Media types are managed in Digital Library → Media Types.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {caps.allowsDocument && upload('documentUrl', 'document', 'application/pdf', 'Book file (PDF)', (n) => set('pages', String(n)))}
          {caps.allowsAudio && upload('audioUrl', 'audio', 'audio/*', 'Audio')}
          {caps.allowsVideo && upload('videoUrl', 'video', 'video/*', 'Video')}
        </div>
        {caps.allowsChapters && <ChaptersEditor chapters={chapters} onChange={setChapters} language={form.language} />}
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-bold tracking-wide text-foreground">Pages, price and copies</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="pub-pages">Pages</Label>
            <Input id="pub-pages" type="number" min={0} value={form.pages} onChange={(e) => set('pages', e.target.value)} placeholder="Filled from the PDF" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pub-price">Buy price (RWF)</Label>
            <Input id="pub-price" type="number" min={0} step={100} value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pub-borrow">Borrow price (RWF)</Label>
            <Input id="pub-borrow" type="number" min={0} step={100} value={form.borrowPrice} onChange={(e) => set('borrowPrice', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pub-qty">Copies</Label>
            <Input id="pub-qty" type="number" min={0} value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">0 means free. The reviewer can see these before approving.</p>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={!!busy} onClick={() => save(false)}>
          {busy === 'draft' ? <Loader2 className="animate-spin" /> : <Save />} Save Draft
        </Button>
        <Button type="submit" disabled={!!busy}>
          {busy === 'submit' ? <Loader2 className="animate-spin" /> : <Send />} Submit for Review
        </Button>
      </div>
      <p className="text-right text-xs text-muted-foreground">After you submit, members see the book only once a reviewer approves it.</p>
    </form>
  )
}
