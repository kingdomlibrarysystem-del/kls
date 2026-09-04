'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import FontSize from '@tiptap/extension-text-style/font-size'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Undo, Redo, RemoveFormatting } from 'lucide-react'

const FONT_FAMILIES = ['Inter', 'Lato', 'Cinzel', 'Georgia', 'Arial', 'Times New Roman']
const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

function ToolbarButton({ onClick, active, disabled, children, title }: {
  onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded text-xs transition-colors ${active ? 'bg-w-600 text-white' : 'bg-white text-w-700 hover:bg-w-100 hover:text-w-900'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )
}

function ToolbarSelect({ value, onChange, options, title }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; title?: string
}) {
  return (
    <select
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1.5 border border-w-400 rounded bg-white font-lato text-xs text-w-800 focus:outline-none focus:border-w-600"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

interface NewsletterEditorProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Rich-text newsletter/article editor built on TipTap.
 * Supports: bold, italic, underline, headings, lists, links,
 * image insertion, font family, font size, text alignment, undo/redo.
 * Output format: sanitized HTML (sanitize before persistence with sanitizeHtml).
 */
export function NewsletterEditor({ value, onChange }: NewsletterEditorProps) {
  const [fontSize, setFontSize] = useState('16px')
  const [fontFamily, setFontFamily] = useState('Lato')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const imageUrlRef = useRef<HTMLInputElement>(null)
  const linkUrlRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  const applyFontFamily = useCallback((family: string) => {
    setFontFamily(family)
    editor?.chain().focus().setFontFamily(family).run()
  }, [editor])

  const applyFontSize = useCallback((size: string) => {
    setFontSize(size)
    editor?.chain().focus().setFontSize(size).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (imageUrl.trim() && editor) {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run()
      setImageUrl('')
      setShowImageInput(false)
    }
  }, [imageUrl, editor])

  const addLink = useCallback(() => {
    if (linkUrl.trim() && editor) {
      editor.chain().focus().setLink({ href: linkUrl.trim(), target: '_blank' }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }, [linkUrl, editor])

  useEffect(() => {
    if (showImageInput) imageUrlRef.current?.focus()
  }, [showImageInput])

  useEffect(() => {
    if (showLinkInput) linkUrlRef.current?.focus()
  }, [showLinkInput])

  if (!editor) return null

  return (
    <div className="border border-w-500 rounded bg-form-bg overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-w-400 bg-w-50">
        <ToolbarSelect title="Font Family" value={fontFamily} onChange={applyFontFamily} options={FONT_FAMILIES.map((f) => ({ value: f, label: f }))} />
        <ToolbarSelect title="Font Size" value={fontSize} onChange={applyFontSize} options={FONT_SIZES.map((s) => ({ value: s, label: s }))} />

        <div className="w-px h-5 bg-w-400 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={14} /></ToolbarButton>

        <div className="w-px h-5 bg-w-400 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={14} /></ToolbarButton>

        <div className="w-px h-5 bg-w-400 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={14} /></ToolbarButton>

        <div className="w-px h-5 bg-w-400 mx-1" />

        <ToolbarButton onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false) }} active={editor.isActive('link')} title="Link"><LinkIcon size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false) }} title="Image"><ImageIcon size={14} /></ToolbarButton>

        <div className="w-px h-5 bg-w-400 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={14} /></ToolbarButton>

        <div className="w-px h-5 bg-w-400 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting"><RemoveFormatting size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={14} /></ToolbarButton>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-w-50 border-b border-w-400">
          <input ref={linkUrlRef} type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="flex-1 px-2 py-1 text-xs border border-w-400 rounded focus:outline-none focus:border-w-600 font-lato" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }} />
          <button type="button" onClick={addLink} className="px-2 py-1 text-xs bg-w-600 text-white rounded hover:bg-w-700 font-lato">Add</button>
          <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl('') }} className="px-2 py-1 text-xs bg-w-200 text-w-700 rounded hover:bg-w-300 font-lato">Cancel</button>
        </div>
      )}

      {showImageInput && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-w-50 border-b border-w-400">
          <input ref={imageUrlRef} type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1 px-2 py-1 text-xs border border-w-400 rounded focus:outline-none focus:border-w-600 font-lato" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }} />
          <button type="button" onClick={addImage} className="px-2 py-1 text-xs bg-w-600 text-white rounded hover:bg-w-700 font-lato">Add</button>
          <button type="button" onClick={() => { setShowImageInput(false); setImageUrl('') }} className="px-2 py-1 text-xs bg-w-200 text-w-700 rounded hover:bg-w-300 font-lato">Cancel</button>
        </div>
      )}

      <EditorContent editor={editor} className="prose prose-sm max-w-none px-4 py-3 min-h-[200px] focus:outline-none font-lato text-sm text-w-950 [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px] [&_.tiptap_p]:mb-2 [&_.tiptap_h1]:text-xl [&_.tiptap_h1]:font-bold [&_.tiptap_h2]:text-lg [&_.tiptap_h2]:font-bold [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-bold [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:mb-1 [&_.tiptap_blockquote]:border-l-3 [&_.tiptap_blockquote]:border-w-500 [&_.tiptap_blockquote]:pl-3 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:text-w-700 [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded" />
    </div>
  )
}
