import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import {
  applyYouTubeEmbedRule,
  applyImageLayoutRule,
  encodeImgLayout,
  extractYouTubeId,
  parseImgLayout,
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

describe('configureMarkdownEditor', () => {
  it('registers global md-editor-rt config without throwing, and is idempotent', () => {
    expect(() => configureMarkdownEditor()).not.toThrow()
    expect(() => configureMarkdownEditor()).not.toThrow()
  })
})
