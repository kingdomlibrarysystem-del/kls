import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../html-sanitizer'

describe('sanitizeHtml', () => {
  it('passes safe HTML through unchanged', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    expect(sanitizeHtml(input)).toBe(input)
  })

  it('strips <script> tags', () => {
    expect(sanitizeHtml('<p>Safe</p><script>alert("xss")</script>')).not.toContain('<script>')
  })

  it('strips event handler attributes', () => {
    const input = '<p onclick="alert(1)">Safe</p>'
    const output = sanitizeHtml(input)
    expect(output).not.toContain('onclick')
    expect(output).toContain('Safe')
  })

  it('strips javascript: URIs in links', () => {
    const input = '<a href="javascript:alert(1)">click</a>'
    const output = sanitizeHtml(input)
    expect(output).not.toContain('javascript:')
  })

  it('allows safe formatting tags', () => {
    const input = '<h1>Title</h1><p>Text <strong>bold</strong> <em>italic</em> <u>underline</u></p>'
    const output = sanitizeHtml(input)
    expect(output).toContain('<h1>')
    expect(output).toContain('<strong>')
    expect(output).toContain('<em>')
    expect(output).toContain('<u>')
  })

  it('allows inline styles (font-family, font-size)', () => {
    const input = '<p style="font-family: Arial; font-size: 16px;">Styled text</p>'
    const output = sanitizeHtml(input)
    expect(output).toContain('font-family')
    expect(output).toContain('font-size')
  })

  it('allows images with src', () => {
    const input = '<img src="https://example.com/image.jpg" alt="Photo" />'
    const output = sanitizeHtml(input)
    expect(output).toContain('src="https://example.com/image.jpg"')
  })

  it('allows links with href', () => {
    const input = '<a href="https://example.com" target="_blank">Link</a>'
    const output = sanitizeHtml(input)
    expect(output).toContain('href="https://example.com"')
    expect(output).toContain('target="_blank"')
  })

  it('allows lists', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>First</li><li>Second</li></ol>'
    const output = sanitizeHtml(input)
    expect(output).toContain('<ul>')
    expect(output).toContain('<ol>')
    expect(output).toContain('<li>')
  })

  it('allows headings', () => {
    const input = '<h1>H1</h1><h2>H2</h2><h3>H3</h3>'
    const output = sanitizeHtml(input)
    expect(output).toContain('<h1>')
    expect(output).toContain('<h2>')
    expect(output).toContain('<h3>')
  })

  it('strips unknown tags but keeps content', () => {
    const input = '<custom-tag>content</custom-tag>'
    const output = sanitizeHtml(input)
    expect(output).not.toContain('custom-tag')
    expect(output).toContain('content')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('handles complex nested HTML', () => {
    const input = `
      <h1>Title</h1>
      <p style="font-family: Georgia; font-size: 18px;">
        A <strong>bold</strong> <em>italic</em> paragraph with
        <a href="https://example.com" target="_blank">a link</a> and
        <img src="https://example.com/img.jpg" alt="image" />.
      </p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <script>alert('xss')</script>
      <p onclick="bad()">Still safe</p>
    `
    const output = sanitizeHtml(input)
    expect(output).toContain('<h1>')
    expect(output).toContain('font-family')
    expect(output).toContain('font-size')
    expect(output).toContain('<strong>')
    expect(output).toContain('<em>')
    expect(output).toContain('href="https://example.com"')
    expect(output).toContain('<img src=')
    expect(output).toContain('<ul>')
    expect(output).not.toContain('<script>')
    expect(output).not.toContain('onclick')
    expect(output).toContain('Still safe')
  })
})
