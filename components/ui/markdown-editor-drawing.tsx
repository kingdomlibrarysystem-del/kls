'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Pencil, Eraser, Minus, ArrowUpRight, Square, Circle, Type, Undo2, Redo2, Trash2, X,
} from 'lucide-react'

const CANVAS_W = 900
const CANVAS_H = 560

type Tool = 'pen' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'text'

interface Point { x: number; y: number }

interface DrawAction {
  kind: 'stroke' | 'line' | 'arrow' | 'rect' | 'circle' | 'text'
  points?: Point[]
  erase?: boolean
  color?: string
  width?: number
  x1?: number; y1?: number; x2?: number; y2?: number
  text?: string; x?: number; y?: number
}

/** Persists a drawing inside a friendly whiteboard — exported to Cloudinary as a PNG so the markdown stores one permanent URL, never a temporary blob. */
interface DrawingDialogProps {
  open: boolean
  onClose: () => void
  onInsertUrl: (url: string) => void
}

const DRAW_COLORS = ['#111111', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff']

const TOOL_ICONS: { tool: Tool; icon: typeof Pencil; label: string }[] = [
  { tool: 'pen', icon: Pencil, label: 'Draw (pen)' },
  { tool: 'eraser', icon: Eraser, label: 'Eraser' },
  { tool: 'line', icon: Minus, label: 'Straight line' },
  { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { tool: 'rect', icon: Square, label: 'Rectangle' },
  { tool: 'circle', icon: Circle, label: 'Circle' },
  { tool: 'text', icon: Type, label: 'Add text' },
]

export function DrawingDialog({ open, onClose, onInsertUrl }: DrawingDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#111111')
  const [lineWidth, setLineWidth] = useState(4)
  const [textDraft, setTextDraft] = useState('')
  const [history, setHistory] = useState<DrawAction[]>([])
  const [redoStack, setRedoStack] = useState<DrawAction[]>([])
  const [draft, setDraft] = useState<DrawAction | null>(null)
  const [error, setError] = useState('')
  const drawingRef = useRef(false)

  const setActions = (next: DrawAction[]) => { setHistory(next); setRedoStack([]) }

  const commit = (action: DrawAction) => {
    setHistory((h) => [...h, action]); setRedoStack([]); setDraft(null); drawingRef.current = false
  }

  const undo = () => {
    if (!history.length) return
    const last = history[history.length - 1]
    setHistory(history.slice(0, -1))
    setRedoStack((r) => [...r, last])
    setDraft(null)
  }

  const redo = () => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack(redoStack.slice(0, -1))
    setHistory((h) => [...h, next])
    setDraft(null)
  }

  const clearCanvas = () => { setActions([]); setDraft(null); setRedoStack([]) }

  const render = useCallback((actions: DrawAction[], live: DrawAction | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    const drawAll = [...actions, ...(live ? [live] : [])]
    for (const a of drawAll) {
      if (a.kind === 'stroke' && a.points && a.points.length) {
        ctx.beginPath()
        ctx.globalCompositeOperation = a.erase ? 'destination-out' : 'source-over'
        ctx.strokeStyle = a.color ?? '#111111'
        ctx.lineWidth = a.width ?? 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(a.points[0].x, a.points[0].y)
        for (const p of a.points) ctx.lineTo(p.x, p.y)
        ctx.stroke()
      } else if (a.kind === 'line' || a.kind === 'arrow') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = a.color ?? '#111111'
        ctx.lineWidth = a.width ?? 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(a.x1 ?? 0, a.y1 ?? 0)
        ctx.lineTo(a.x2 ?? 0, a.y2 ?? 0)
        ctx.stroke()
        if (a.kind === 'arrow') {
          const ang = Math.atan2((a.y2 ?? 0) - (a.y1 ?? 0), (a.x2 ?? 0) - (a.x1 ?? 0))
          const head = 14
          ctx.beginPath()
          ctx.moveTo(a.x2 ?? 0, a.y2 ?? 0)
          ctx.lineTo((a.x2 ?? 0) - head * Math.cos(ang - Math.PI / 6), (a.y2 ?? 0) - head * Math.sin(ang - Math.PI / 6))
          ctx.moveTo(a.x2 ?? 0, a.y2 ?? 0)
          ctx.lineTo((a.x2 ?? 0) - head * Math.cos(ang + Math.PI / 6), (a.y2 ?? 0) - head * Math.sin(ang + Math.PI / 6))
          ctx.stroke()
        }
      } else if (a.kind === 'rect' || a.kind === 'circle') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = a.color ?? '#111111'
        ctx.lineWidth = a.width ?? 4
        const x1 = Math.min(a.x1 ?? 0, a.x2 ?? 0)
        const y1 = Math.min(a.y1 ?? 0, a.y2 ?? 0)
        const w = Math.abs((a.x2 ?? 0) - (a.x1 ?? 0))
        const h = Math.abs((a.y2 ?? 0) - (a.y1 ?? 0))
        ctx.beginPath()
        if (a.kind === 'rect') ctx.rect(x1, y1, w, h)
        else ctx.ellipse(x1 + w / 2, y1 + h / 2, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (a.kind === 'text') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = a.color ?? '#111111'
        ctx.font = `28px Georgia, serif`
        ctx.fillText(a.text ?? '', a.x ?? 0, a.y ?? 0)
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [])

  useEffect(() => {
    if (open) render(history, draft)
  }, [open, history, draft, tool, color, lineWidth, render])

  const toCanvas = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      if (textDraft.trim()) {
        commit({ kind: 'text', text: textDraft.trim(), x: PointX(e), y: PointY(e), color, width: lineWidth })
        setTextDraft('')
      }
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = toCanvas(e)
    if (tool === 'pen' || tool === 'eraser') {
      setDraft({ kind: 'stroke', points: [p], erase: tool === 'eraser', color, width: lineWidth })
    } else {
      setDraft({ kind: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, width: lineWidth } as DrawAction)
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !draft) return
    const p = toCanvas(e)
    if (draft.kind === 'stroke') {
      setDraft({ ...draft, points: [...(draft.points ?? []), p] })
    } else {
      setDraft({ ...draft, x2: p.x, y2: p.y })
    }
  }

  const onPointerUp = () => {
    if (!drawingRef.current || !draft) return
    if (draft.kind === 'stroke') commit(draft)
    else commit({ ...draft, x2: draft.x2 ?? draft.x1!, y2: draft.y2 ?? draft.y1! } as DrawAction)
  }

  const PointX = (e: ReactPointerEvent<HTMLCanvasElement>) => toCanvas(e).x
  const PointY = (e: ReactPointerEvent<HTMLCanvasElement>) => toCanvas(e).y

  const uploadAndInsert = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setError('')
    const dataUrl = canvas.toDataURL('image/png')
    const blob = await (await fetch(dataUrl)).blob()

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      setError('Cloudinary is not configured (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)')
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', blob, 'drawing.png')
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', 'kcs-resources/image')
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? 'Upload failed')
      onInsertUrl(json.secure_url as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-xl border border-w-200 bg-white p-5 shadow-2xl flex flex-col gap-3 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h4 className="font-cinzel text-sm font-bold uppercase tracking-widest text-w-950">Drawing</h4>
          <button type="button" onClick={onClose} aria-label="Close drawing" className="text-w-600 hover:text-w-950 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <p className="font-lato text-[11px] text-w-600">
          Draw with the pen, add shapes or text, then Save — the drawing is uploaded to Cloudinary and inserted into your document as a permanent image.
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {TOOL_ICONS.map(({ tool: t, icon: Icon, label }) => (
            <button
              key={t}
              type="button"
              onClick={() => setTool(t)}
              aria-label={label}
              aria-pressed={tool === t}
              title={label}
              className={`flex h-8 w-8 items-center justify-center rounded border cursor-pointer transition ${
                tool === t ? 'border-w-600 bg-w-100 text-w-950' : 'border-w-300 text-w-700 hover:border-w-400'
              }`}
            >
              <Icon size={15} />
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            {DRAW_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={`h-6 w-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-w-950' : ''}`}
                style={{ background: c }}
              />
            ))}
            <label className="flex items-center gap-1 ml-1 cursor-pointer">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Custom color" className="h-6 w-6 cursor-pointer border border-w-300 rounded" />
            </label>
          </div>
          <label className="flex items-center gap-2 font-lato text-xs text-w-700 ml-2">
            <input type="range" min={1} max={16} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-24 accent-w-950" aria-label="Line width" />
            {lineWidth}px
          </label>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={undo} aria-label="Undo" title="Undo" className="flex h-8 w-8 items-center justify-center rounded border border-w-300 text-w-700 hover:border-w-400 cursor-pointer transition"><Undo2 size={14} /></button>
            <button type="button" onClick={redo} aria-label="Redo" title="Redo" className="flex h-8 w-8 items-center justify-center rounded border border-w-300 text-w-700 hover:border-w-400 cursor-pointer transition"><Redo2 size={14} /></button>
            <button type="button" onClick={clearCanvas} aria-label="Clear drawing" title="Clear" className="flex h-8 items-center gap-1 rounded border border-red-200 text-red-700 px-2 text-xs font-lato hover:bg-red-50 cursor-pointer transition"><Trash2 size={13} /> Clear</button>
          </div>
        </div>

        {tool === 'text' && (
          <div className="flex items-center gap-2">
            <label className="font-lato text-xs text-w-700">Text:</label>
            <input
              type="text"
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setTool('pen') }}
              placeholder="Type then click on the canvas to place it"
              aria-label="Text to place on the drawing"
              className="flex-1 font-lato text-xs border border-w-300 rounded px-2 py-1 bg-white text-w-950 focus:outline-none focus:border-w-500"
            />
            <button type="button" onClick={() => { if (textDraft.trim()) setTool('pen') }} className="rounded border border-w-300 text-w-800 px-2 py-1 text-xs font-lato hover:bg-w-100 cursor-pointer transition">Done</button>
          </div>
        )}

        <div className="rounded-lg border border-w-200 overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="block w-full touch-none cursor-crosshair"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            aria-label="Drawing canvas"
          />
        </div>

        {error && <p className="text-red-600 text-xs font-lato">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-w-200">
          <button type="button" onClick={onClose} className="rounded-lg border border-w-300 text-w-800 px-4 py-1.5 text-xs font-lato hover:bg-w-100 transition cursor-pointer">Cancel</button>
          <button type="button" onClick={uploadAndInsert} className="rounded-lg bg-w-950 text-white px-4 py-1.5 text-xs font-lato font-semibold hover:opacity-90 transition cursor-pointer">
            Save Drawing & Insert
          </button>
        </div>
      </div>
    </div>
  )
}