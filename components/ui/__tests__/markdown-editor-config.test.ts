import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { applyYouTubeEmbedRule, extractYouTubeId, configureMarkdownEditor } from '../markdown-editor-config'

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

describe('configureMarkdownEditor', () => {
  it('registers global md-editor-rt config without throwing, and is idempotent', () => {
    expect(() => configureMarkdownEditor()).not.toThrow()
    expect(() => configureMarkdownEditor()).not.toThrow()
  })
})
