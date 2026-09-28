import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { JSDOM } from 'jsdom'
import {
  applyYouTubeEmbedRule,
  applyImageLayoutRule,
  applyRichTextRule,
  encodeDocumentStyle,
  encodeImgLayout,
  extractYouTubeId,
  parseDocumentStyle,
  parseImgCaption,
  parseImgLayout,
  sanitizeRichHtml,
  stripSelectionStyles,
  wrapSelectionInSpan,
  configureMarkdownEditor,
} from '../markdown-editor-config'

function render(markdown: string): string {
  const md = new MarkdownIt()
  applyYouTubeEmbedRule(md)
  return md.render(markdown)
}

describe('extractYouTubeId', () => {
  it('extracts the video id from watch, embed, and short URL forms', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=H14bBuluwB8')).toBe('H14bBuluwB8')
    expect(extractYouTubeId('https://www.youtube.com/embed/H14bBuluwB8')).toBe('H14bBuluwB8')
    expect(extractYouTubeId('https://youtu.be/H14bBuluwB8')).toBe('H14bBuluwB8')
  })

  it('returns null for a non-YouTube URL', () => {
    expect(extractYouTubeId('https://example.com/article')).toBeNull()
  })
})

describe('applyYouTubeEmbedRule', () => {
  it('renders a youtube.com/watch link as a real iframe embed, not a plain anchor', () => {
    const html = render('Watch this: [video](https://www.youtube.com/watch?v=H14bBuluwB8)')
    expect(html).toContain('<iframe src="https://www.youtube.com/embed/H14bBuluwB8"')
    expect(html).not.toMatch(/<a[^>]+href="https:\/\/www\.youtube\.com/)
  })

  it('renders a youtu.be short link and a youtube.com/embed link the same way', () => {
    expect(render('[a](https://youtu.be/H14bBuluwB8)')).toContain('src="https://www.youtube.com/embed/H14bBuluwB8"')
    expect(render('[a](https://www.youtube.com/embed/H14bBuluwB8)')).toContain('src="https://www.youtube.com/embed/H14bBuluwB8"')
  })

  it('leaves a non-YouTube link rendered as a normal anchor', () => {
    const html = render('[a real link](https://example.com/article)')
    expect(html).toContain('<a href="https://example.com/article">a real link</a>')
    expect(html).not.toContain('<iframe')
  })

  it('renders a YouTube link correctly alongside a normal link on the same line', () => {
    const html = render('See [this video](https://www.youtube.com/watch?v=H14bBuluwB8) or [read more](https://example.com)')
    expect(html).toContain('<iframe src="https://www.youtube.com/embed/H14bBuluwB8"')
    expect(html).toContain('<a href="https://example.com">read more</a>')
  })

  it('renders two consecutive YouTube links independently, one per line', () => {
    const html = render('[first](https://www.youtube.com/watch?v=H14bBuluwB8)\n\n[second](https://youtu.be/abcdefghijk)')
    expect(html).toContain('src="https://www.youtube.com/embed/H14bBuluwB8"')
    expect(html).toContain('src="https://www.youtube.com/embed/abcdefghijk"')
  })
})

function renderImage(markdown: string): string {
  const md = new MarkdownIt()
  applyImageLayoutRule(md)
  return md.render(markdown)
}

describe('parseImgLayout', () => {
  it('returns the default block layout for empty/absent titles', () => {
    expect(parseImgLayout(undefined)).toEqual({ align: 'none', width: 100 })
    expect(parseImgLayout('')).toEqual({ align: 'none', width: 100 })
    expect(parseImgLayout('just a normal title')).toEqual({ align: 'none', width: 100 })
  })

  it('parses align and width from the kcs-* DSL', () => {
    expect(parseImgLayout('kcs-left w35')).toEqual({ align: 'left', width: 35 })
    expect(parseImgLayout('kcs-right w40')).toEqual({ align: 'right', width: 40 })
    expect(parseImgLayout('kcs-center w60')).toEqual({ align: 'center', width: 60 })
    expect(parseImgLayout('w70')).toEqual({ align: 'none', width: 70 })
  })

  it('clamps width to the 10–100 range and ignores unknown directives', () => {
    expect(parseImgLayout('kcs-right w5')).toEqual({ align: 'right', width: 10 })
    expect(parseImgLayout('w250')).toEqual({ align: 'none', width: 100 })
    expect(parseImgLayout('kcs-bogus w50')).toEqual({ align: 'none', width: 50 })
  })
})

describe('encodeImgLayout', () => {
  it('writes a titled image when a layout is applied, plain when not', () => {
    expect(encodeImgLayout('Book', 'https://cloud.com/a.jpg', { align: 'left', width: 35 })).toBe('![Book](https://cloud.com/a.jpg "kcs-left w35")')
    expect(encodeImgLayout('Book', 'https://cloud.com/a.jpg', { align: 'right', width: 100 })).toBe('![Book](https://cloud.com/a.jpg "kcs-right")')
    expect(encodeImgLayout('Book', 'https://cloud.com/a.jpg', { align: 'none', width: 100 })).toBe('![Book](https://cloud.com/a.jpg)')
  })
})

describe('applyImageLayoutRule', () => {
  it('leaves a plain image as a kcs-img block with no layout spans', () => {
    const html = renderImage('![Book](https://cloud.com/a.jpg)')
    expect(html).toContain('<img src="https://cloud.com/a.jpg" alt="Book" class="kcs-img"')
    expect(html).not.toContain('kcs-img-wrap')
    expect(html).not.toContain('float:')
  })

  it('wraps a left image so prose flows right of it', () => {
    const html = renderImage('![Chart](https://cloud.com/c.png "kcs-left w35")')
    expect(html).toContain('class="kcs-img-wrap kcs-img-left"')
    expect(html).toContain('style="width:35%;float:left;margin:4px 16px 12px 0"')
    expect(html).toContain('<img src="https://cloud.com/c.png" alt="Chart" class="kcs-img"')
  })

  it('wraps a right image so prose flows left of it', () => {
    const html = renderImage('![Chart](https://cloud.com/c.png "kcs-right w40")')
    expect(html).toContain('class="kcs-img-wrap kcs-img-right"')
    expect(html).toContain('style="width:40%;float:right;margin:4px 0 12px 16px"')
  })

  it('centers an image with its chosen width', () => {
    const html = renderImage('![Logo](https://cloud.com/l.png "kcs-center w60")')
    expect(html).toContain('class="kcs-img kcs-img-center" style="width:60%"')
    expect(html).not.toContain('kcs-img-wrap')
  })
})

describe('configureMarkdownEditor composition', () => {
  it('registers both the video and image renderer rules together', () => {
    const md = new MarkdownIt()
    applyYouTubeEmbedRule(md)
    applyImageLayoutRule(md)
    const html = md.render('![A](https://cloud.com/a.jpg "kcs-left w35")\n\n[see](https://www.youtube.com/watch?v=H14bBuluwB8)')
    expect(html).toContain('kcs-img-wrap kcs-img-left')
    expect(html).toContain('<iframe src="https://www.youtube.com/embed/H14bBuluwB8"')
  })
})

function renderRich(markdown: string): string {
  const md = new MarkdownIt()
  applyRichTextRule(md)
  return md.renderInline(markdown)
}

describe('applyRichTextRule (compact rich-text DSL)', () => {
  it('renders a color token as an inline span', () => {
    expect(renderRich('[[c:#0ea5e9|tsss]]')).toBe('<span style="color:#0ea5e9">tsss</span>')
  })

  it('renders a highlight token as a mark', () => {
    expect(renderRich('[[h:#3b82f6|text]]')).toBe('<mark style="background-color:#3b82f6">text</mark>')
  })

  it('renders font-family and font-size tokens as spans', () => {
    expect(renderRich('[[ff:Georgia, serif|paragraph]]')).toBe('<span style="font-family:Georgia, serif">paragraph</span>')
    expect(renderRich('[[fs:18px|text]]')).toBe('<span style="font-size:18px">text</span>')
  })

  it('keeps quoted font stacks working through the attribute', () => {
    expect(renderRich('[[ff:Garamond, "EB Garamond", serif|paragraph]]')).toBe('<span style="font-family:Garamond, &quot;EB Garamond&quot;, serif">paragraph</span>')
  })

  it('escapes the inner text so tokens can never smuggle HTML', () => {
    expect(renderRich('[[c:#000000|<b>hi]]')).toBe('<span style="color:#000000">&lt;b&gt;hi</span>')
  })

  it('composes with surrounding prose and multiple tokens', () => {
    expect(renderRich('a [[c:#ef4444|red]] b [[h:#fef08a|mark]] c'))
      .toBe('a <span style="color:#ef4444">red</span> b <mark style="background-color:#fef08a">mark</mark> c')
  })

  it('leaves malformed or invalid tokens as literal text', () => {
    expect(renderRich('[[c:red|x]]')).toBe('[[c:red|x]]')
    expect(renderRich('[[fs:big|x]]')).toBe('[[fs:big|x]]')
    expect(renderRich('[[ff:serif<b|x]]')).toBe('[[ff:serif&lt;b|x]]')
    expect(renderRich('[[c:#000 no close')).toBe('[[c:#000 no close')
  })

  it('supports 3-digit hex colors', () => {
    expect(renderRich('[[c:#f00|x]]')).toBe('<span style="color:#f00">x</span>')
  })
})

describe('parseImgCaption', () => {
  it('returns an empty string when no caption token exists', () => {
    expect(parseImgCaption(undefined)).toBe('')
    expect(parseImgCaption('kcs-center w60')).toBe('')
  })

  it('decodes the cap= token, with or without layout tokens', () => {
    expect(parseImgCaption('cap=Our%20annual%20report')).toBe('Our annual report')
    expect(parseImgCaption('kcs-center w60 cap=Report%201')).toBe('Report 1')
  })

  it('never decodes characters that could introduce HTML', () => {
    expect(parseImgCaption('cap=<script>x</script>')).toBe('')
    expect(parseImgCaption('cap=1<img>')).toBe('1')
  })
})

describe('encodeImgLayout with captions', () => {
  it('embeds a caption into the title token and never leaks it without cap=', () => {
    const md = encodeImgLayout('Book', 'https://cloud.com/a.jpg', { align: 'none', width: 100 }, 'Figure 1')
    expect(md).toBe('![Book](https://cloud.com/a.jpg "cap=Figure%201")')
    expect(encodeImgLayout('Book', 'https://cloud.com/a.jpg', { align: 'none', width: 100 })).toBe('![Book](https://cloud.com/a.jpg)')
  })

  it('round-trips layout + caption through the DSL', () => {
    const md = encodeImgLayout('Book', 'https://cloud.com/a.jpg', { align: 'center', width: 60 }, 'My chart')
    expect(md).toBe('![Book](https://cloud.com/a.jpg "kcs-center w60 cap=My%20chart")')
    const title = / "([^"]+)"\)$/.exec(md)?.[1] ?? ''
    expect(parseImgLayout(title)).toEqual({ align: 'center', width: 60 })
    expect(parseImgCaption(title)).toBe('My chart')
  })
})

describe('applyImageLayoutRule with captions', () => {
  it('renders a centered captioned image as a figure', () => {
    const html = renderImage('![Logo](https://cloud.com/l.png "kcs-center w60 cap=Our%20logo")')
    expect(html).toContain('<figure class="kcs-figure kcs-figure-center">')
    expect(html).toContain('<img src="https://cloud.com/l.png" alt="Logo" class="kcs-img kcs-img-center" style="width:60%"')
    expect(html).toContain('<figcaption>Our logo</figcaption>')
    expect(html).toContain('</figure>')
  })

  it('renders a floated captioned image with the caption inside the figure', () => {
    const html = renderImage('![A](https://cloud.com/a.jpg "kcs-right w40 cap=Caption")')
    expect(html).toContain('<figure class="kcs-figure kcs-figure-right">')
    expect(html).toContain('<figcaption>Caption</figcaption>')
  })

  it('keeps a plain captioned image inside a bare figure', () => {
    const html = renderImage(`![Plain](https://cloud.com/p.png "cap=A%20caption")`)
    expect(html).toContain('<figure class="kcs-figure">')
    expect(html).toContain('<figcaption>A caption</figcaption>')
  })

  it('escapes special characters in captions and never emits raw HTML', () => {
    const html = renderImage('![A](https://cloud.com/a.jpg "cap=Rock%20%26%20roll")')
    expect(html).toContain('<figcaption>Rock &amp; roll</figcaption>')
    expect(html).not.toContain('<script')
  })
})

describe('document line spacing', () => {
  it('parses a valid lineHeight marker', () => {
    const { style, content } = parseDocumentStyle('<!-- kcs-style:{"lineHeight":"1.5"} -->\nHello')
    expect(style.lineHeight).toBe('1.5')
    expect(content).toBe('Hello')
  })

  it('rejects a non-numeric lineHeight', () => {
    const { style } = parseDocumentStyle('<!-- kcs-style:{"lineHeight":"abc"} -->\nHello')
    expect(style.lineHeight).toBeUndefined()
    expect(style.align).toBeUndefined()
  })

  it('encodes lineHeight back into the marker', () => {
    expect(encodeDocumentStyle('Body', { lineHeight: '1.75' })).toBe('<!-- kcs-style:{"lineHeight":"1.75"} -->\nBody')
  })
})

describe('sanitizeRichHtml', () => {
  const { window } = new JSDOM('')
  const { DOMParser, HTMLElement } = window
  ;(globalThis as Record<string, unknown>).DOMParser = DOMParser
  ;(globalThis as Record<string, unknown>).HTMLElement = HTMLElement

  it('removes scripts and event-handler attributes entirely', () => {
    const html = sanitizeRichHtml('<script>alert(1)</script><p onclick="steal()">Hi</p>')
    expect(html).not.toContain('script')
    expect(html).not.toContain('onclick')
    expect(html).toContain('Hi')
  })

  it('drops javascript: URLs while keeping real http(s) links with rel/noopener', () => {
    const html = sanitizeRichHtml('<a href="javascript:alert(1)">bad</a><a href="https://example.com">good</a>')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('good')
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">good</a>')
  })

  it('keeps author rich-text spans only for allowlisted style props', () => {
    const html = sanitizeRichHtml('<p>Hello <span style="color:#ef4444;position:fixed;zoom:2">world</span> <mark style="background-color:#fef08a">highlight</mark></p>')
    expect(html).toContain('<span style="color:')
    expect(html).toContain('world</span>')
    expect(html).toContain('<mark style="background-color:')
    expect(html).toContain('highlight</mark>')
    expect(html).not.toContain('position')
    expect(html).not.toContain('zoom')
  })

  it('keeps only allowlisted classes from a class list', () => {
    const html = sanitizeRichHtml('<img src="https://cloud.com/a.jpg" class="kcs-img kcs-img-center evil-class" onerror="alert(1)">')
    expect(html).toContain('class="kcs-img kcs-img-center"')
    expect(html).not.toContain('evil-class')
    expect(html).not.toContain('onerror')
  })

  it('drops non-YouTube iframes and keeps youtube embeds', () => {
    const safe = sanitizeRichHtml('<iframe src="https://www.youtube.com/embed/H14bBuluwB8" title="v"></iframe>')
    expect(safe).toContain('youtube.com/embed/H14bBuluwB8')
    const unsafe = sanitizeRichHtml('<iframe src="https://evil.example/x"></iframe>')
    expect(unsafe).not.toContain('iframe')
  })

  it('strips unknown tags but keeps their text', () => {
    expect(sanitizeRichHtml('<div>Keep <b>bold</b></div><aside>drop</aside>')).toBe('<div>Keep <b>bold</b></div>')
  })

  it('sanitizes the full rendered preview pipeline for captioned figures', () => {
    const md = new MarkdownIt()
    applyImageLayoutRule(md)
    const raw = md.render('![A](https://cloud.com/a.jpg "kcs-center w60 cap=T%20caption")')
    const html = sanitizeRichHtml(raw)
    expect(html).toContain('<figure class="kcs-figure kcs-figure-center">')
    expect(html).toContain('<figcaption>T caption</figcaption>')
  })
})

describe('wrapSelectionInSpan', () => {
  it('wraps the selected range in a styled span and returns inner-text offsets', () => {
    const text = 'Hello world!'
    const res = wrapSelectionInSpan(text, text.indexOf('world'), text.indexOf('world') + 'world'.length, 'color:#ef4444')
    expect(res.applied).toBe(true)
    expect(res.text).toBe('Hello <span style="color:#ef4444">world</span>!')
    expect(res.text.slice(res.from, res.to)).toBe('world')
  })

  it('is idempotent — re-applying the exact same style leaves the text untouched', () => {
    const text = 'Hello world!'
    const first = wrapSelectionInSpan(text, text.indexOf('world'), text.indexOf('world') + 'world'.length, 'color:#ef4444')
    const innerFrom = first.text.indexOf('world')
    const again = wrapSelectionInSpan(first.text, innerFrom, innerFrom + 'world'.length, 'color:#ef4444')
    expect(again.applied).toBe(false)
    expect(again.text).toBe(first.text)
  })

  it('nests a different property on top of an existing span', () => {
    const text = 'Some text'
    const first = wrapSelectionInSpan(text, text.indexOf('Some'), text.indexOf('Some') + 'Some'.length, 'color:#ef4444')
    const innerFrom = first.text.indexOf('Some')
    const second = wrapSelectionInSpan(first.text, innerFrom, innerFrom + 'Some'.length, 'font-size:18px')
    expect(second.applied).toBe(true)
    expect(second.text).toBe('<span style="color:#ef4444"><span style="font-size:18px">Some</span></span> text')
  })

  it('rejects a collapsed selection and malformed css', () => {
    expect(wrapSelectionInSpan('text', 2, 2, 'color:#000').applied).toBe(false)
    expect(wrapSelectionInSpan('text', 0, 2, 'notacssvalue').applied).toBe(false)
    expect(wrapSelectionInSpan('text', 0, 2, 'position:fixed').applied).toBe(false)
  })
})

describe('stripSelectionStyles', () => {
  const stripColor = (text: string, from: number, to: number) =>
    stripSelectionStyles(text, from, to, new Set(['color'] as const))

  it('removes a fully-contained styled span and re-maps the selection', () => {
    const text = 'a <span style="color:#ef4444">red</span> b'
    const from = text.indexOf('red')
    const res = stripColor(text, from, from + 'red'.length)
    expect(res.applied).toBe(true)
    expect(res.text).toBe('a red b')
    expect(res.text.slice(res.from, res.to)).toBe('red')
  })

  it('also unwraps a span that spans across the selection boundary', () => {
    const text = '<span style="color:#2563eb">inside</span> after'
    const from = text.indexOf('inside')
    const res = stripColor(text, from, from + 'inside'.length)
    expect(res.applied).toBe(true)
    expect(res.text).toBe('inside after')
    expect(res.text.slice(res.from, res.to)).toBe('inside')
  })

  it('keeps unrelated styles when stripping only the requested property', () => {
    const text = '<span style="color:#111;font-size:18px">styled</span>'
    const res = stripColor(text, 0, text.length)
    expect(res.text).toBe('<span style="font-size:18px">styled</span>')
  })

  it('only touches spans intersecting the selection and leaves the rest intact', () => {
    const text = 'x <span style="color:#ef4444">one</span> y <span style="color:#2563eb">two</span> z'
    const from = text.indexOf('one')
    const res = stripColor(text, from, from + 'one'.length)
    expect(res.text).toBe('x one y <span style="color:#2563eb">two</span> z')
  })

  it('strips multiple properties across the whole selection', () => {
    const text = '<span style="color:#111">a</span> <span style="background-color:#fef08a">b</span>'
    const res = stripSelectionStyles(
      text,
      0,
      text.length,
      new Set(['color', 'background-color', 'font-family', 'font-size'] as const),
    )
    expect(res.text).toBe('a b')
  })
})

describe('inline rich-text preview pipeline (html:true + sanitize)', () => {
  const { window } = new JSDOM('')
  ;(globalThis as Record<string, unknown>).DOMParser = window.DOMParser
  ;(globalThis as Record<string, unknown>).HTMLElement = window.HTMLElement

  it('keeps author span styles through markdown rendering and the sanitizer', () => {
    const md = new MarkdownIt({ html: true })
    const raw = md.render('Hello <span style="color:#ef4444;position:fixed">red</span> <mark style="background-color:#fef08a">hl</mark>')
    const html = sanitizeRichHtml(raw)
    // CSSOM normalizes hex colors to rgb(), which still renders correctly.
    expect(html).toContain('<span style="color: rgb(239, 68, 68)">red</span>')
    expect(html).toContain('<mark style="background-color: rgb(254, 240, 138)">hl</mark>')
    expect(html).not.toContain('position')
    expect(html).not.toContain('fixed')
  })

  it('round-trips a font-family span and keeps the attribute valid after CSSOM quote normalization', () => {
    const md = new MarkdownIt({ html: true })
    const raw = md.render('A <span style="font-family:Times New Roman, Times, serif">word</span>')
    expect(sanitizeRichHtml(raw)).toContain(
      '<span style="font-family: &quot;Times New Roman&quot;, Times, serif">word</span>',
    )
  })
})

describe('configureMarkdownEditor', () => {
  it('registers global md-editor-rt config without throwing, and is idempotent', () => {
    expect(() => configureMarkdownEditor()).not.toThrow()
    expect(() => configureMarkdownEditor()).not.toThrow()
  })
})
