'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import 'md-editor-rt/lib/style.css'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Image as ImageIcon, X } from 'lucide-react'
import { configureMarkdownEditor, encodeImgLayout, parseImgLayout, type ImgLayout } from './markdown-editor-config'

const MdEditor = dynamic(() => import('md-editor-rt').then((m) => m.MdEditor), { ssr: false })

configureMarkdownEditor()

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

/** Matches `![alt](url "title")` — title may be in single or double quotes. */
const IMG_RE = /!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+(["'])([\s\S]*?)\3)?\s*\)/g

interface FoundImage {
  alt: string
  url: string
  title: string
  raw: string
  /** Global character offset of the matched markdown segment in the document. */
  offset: number
}

function scanImages(value: string): FoundImage[] {
  const out: FoundImage[] = []
  const re = new RegExp(IMG_RE.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(value))) {
    out.push({ alt: m[1], url: m[2], title: m[4] ?? '', raw: m[0], offset: m.index })
  }
  return out
}

function replaceAt(value: string, start: number, end: number, next: string): string {
  return value.slice(0, start) + next + value.slice(end)
}

type AlignOption = ImgLayout['align']

const ALIGN_OPTIONS: { value: AlignOption; label: string; icon: typeof AlignLeft }[] = [
  { value: 'none', label: 'Block', icon: AlignJustify },
  { value: 'left', label: 'Text right of image', icon: AlignLeft },
  { value: 'right', label: 'Text left of image', icon: AlignRight },
  { value: 'center', label: 'Centered', icon: AlignCenter },
]

/**
 * A real book lets the author place an image where they want and wrap the
 * prose around it: size + alignment picker for any image already in the
 * document. Rewrites the image's markdown title to the kcs-* layout DSL
 * (see markdown-editor-config.ts), which the shared renderer reads to emit
 * a centered block or a text-wrapping float in both the editor preview and
 * the member reader.
 */
function ImageLayoutDialog({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const images = scanImages(value)
  const [selected, setSelected] = useState(0)
  const [layout, setLayout] = useState<ImgLayout>(() => parseImgLayout(images[selected]?.title))

  const pick = (i: number) => {
    setSelected(i)
    setLayout(parseImgLayout(images[i].title))
  }

  const apply = () => {
    const target = images[selected]
    if (!target) return
    onChange(replaceAt(value, target.offset, target.offset + target.raw.length, encodeImgLayout(target.alt, target.url, layout)))
  }

  return (
    <div className="kcs-img-layout fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-w-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-cinzel text-sm font-bold uppercase tracking-widest text-w-950">Image size &amp; alignment</h4>
          <button type="button" onClick={onClose} aria-label="Close image layout" className="text-w-600 hover:text-w-950 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {images.length === 0 ? (
          <p className="font-lato text-sm text-w-700">
            No images in this document yet. Upload one with the <ImageIcon size={12} className="inline-block align-[-2px]" /> image toolbar button, or paste an image, then open this again.
          </p>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {images.map((img, i) => (
                <button
                  key={`${img.offset}-${img.url}`}
                  type="button"
                  onClick={() => pick(i)}
                  title={img.alt || img.url}
                  className={`relative shrink-0 w-16 h-12 rounded overflow-hidden border-2 cursor-pointer transition ${i === selected ? 'border-w-600 shadow-md' : 'border-w-300 hover:border-w-400'}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute top-0.5 left-1 text-[9px] font-lato font-bold text-white bg-black/50 rounded px-1">{i + 1}</span>
                </button>
              ))}
            </div>

            <div className="mb-3">
              <p className="font-lato text-xs font-semibold text-w-800 mb-1.5">Alignment</p>
              <div className="grid grid-cols-4 gap-2">
                {ALIGN_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLayout((l) => ({ ...l, align: opt.value }))}
                      className={`flex flex-col items-center gap-1 rounded border px-1 py-2 text-[11px] font-lato cursor-pointer transition ${
                        layout.align === opt.value ? 'border-w-600 bg-w-100 text-w-950 font-semibold' : 'border-w-300 text-w-700 hover:border-w-400'
                      }`}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-lato text-xs font-semibold text-w-800">Width</p>
                <span className="font-lato text-xs text-w-600">{layout.width}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={layout.width}
                onChange={(e) => setLayout((l) => ({ ...l, width: Number(e.target.value) }))}
                className="w-full accent-w-950"
              />
              <p className="font-lato text-[11px] text-w-600 mt-1">
                {layout.align === 'left' || layout.align === 'right'
                  ? 'The image floats beside the paragraph and your text wraps around it — like a real book.'
                  : layout.align === 'center'
                    ? 'The image stands alone in the middle of the page at this width.'
                    : 'The image sits on its own line at this width.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-w-200">
              <span className="font-lato text-[11px] text-w-600">Image {selected + 1} of {images.length}</span>
              <div className="flex gap-2">
                <button type="button" onClick={apply} className="rounded-lg bg-w-950 text-white px-4 py-1.5 text-xs font-lato font-semibold hover:opacity-90 transition cursor-pointer">
                  Apply
                </button>
                <button type="button" onClick={onClose} className="rounded-lg border border-w-300 text-w-800 px-4 py-1.5 text-xs font-lato hover:bg-w-100 transition cursor-pointer">
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Real markdown authoring editor — one lesson/chapter/article can freely
 * mix headings, paragraphs, images, and code blocks in a single document.
 * The toolbar's built-in image button uploads each picked file straight
 * to Cloudinary's unsigned API endpoint using the same `kls_uploads`
 * upload preset as the CldUploadWidget pickers, then inserts a real
 * markdown ![](secure_url) at the cursor. The extra toolbar button opens
 * the image size & alignment dialog so an author can position any image
 * and wrap book text around it, exactly like a real book layout.
 *
 * Why not POST /api/uploads like this editor used to: that route performs
 * a SERVER-SIGNED Cloudinary upload and needs CLOUDINARY_API_KEY +
 * CLOUDINARY_API_SECRET in the server environment. This repo's .env only
 * carries the public cloud name + unsigned preset (intentionally, so
 * client-side widgets work), so the signed route always 500s here with the
 * generic "An unexpected error occurred" message. Using the unsigned REST
 * endpoint (the exact mechanism CldUploadWidget uses under the hood) needs
 * no server secrets, works in dev and prod, and keeps the single-picker
 * UX — no double file dialog.
 *
 * To embed a video, an author pastes a YouTube link on its own line — the
 * member-facing renderer (components/ui/markdown-content.tsx) turns that
 * into a real iframe.
 */
export function MarkdownEditor({ value, onChange, height = 360 }: MarkdownEditorProps) {
  const [layoutOpen, setLayoutOpen] = useState(false)

  return (
    <>
      <style>{`
        .md-editor-preview .kcs-img { max-width: 100%; border-radius: 8px; display: block; margin: 14px 0; }
        .md-editor-preview .kcs-img-center { margin-left: auto; margin-right: auto; }
        .md-editor-preview .kcs-img-wrap { box-sizing: border-box; }
        .md-editor-preview .kcs-img-wrap .kcs-img { width: 100%; height: auto; margin: 0; }
        .md-editor-preview :is(h1,h2,h3,h4,h5,table,blockquote,pre,ul,ol,hr) { clear: both; }
        .md-editor-preview img:not(.kcs-img) { max-width: 100%; }
      `}</style>
      <MdEditor
        modelValue={value}
        onChange={onChange}
        language="en-US"
        style={{ height }}
        defToolbars={[
          <button
            key="kcs-img-layout"
            type="button"
            title="Image size & alignment"
            aria-label="Set image size and alignment"
            onClick={() => setLayoutOpen(true)}
            className="flex h-full items-center px-2 cursor-pointer hover:opacity-75"
          >
            <ImageIcon size={16} />
          </button>,
        ]}
        onUploadImg={async (files, callback) => {
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
          if (!cloudName || !uploadPreset) {
            throw new Error('Cloudinary is not configured (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)')
          }
          const uploaded = await Promise.all(
            files.map(async (file) => {
              const formData = new FormData()
              formData.append('file', file)
              formData.append('upload_preset', uploadPreset)
              formData.append('folder', 'kcs-resources/image')
              const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
              const json = await res.json()
              if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? 'Upload failed')
              return json.secure_url as string
            })
          )
          callback(uploaded)
        }}
      />
      {layoutOpen && <ImageLayoutDialog value={value} onChange={onChange} onClose={() => setLayoutOpen(false)} />}
    </>
  )
}