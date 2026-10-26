import { describe, expect, it } from 'vite-plus/test'
import { createDraft, encodedValue, inputError, isDraft, snapshotDraft } from '@/lib/qr'

describe('QR content', () => {
  it('accepts only HTTP(S) links in URL mode', () => {
    for (const value of [
      'https://example.com/日本語?q=🌷',
      'http://example.com',
      '  https://example.com  ',
    ]) {
      expect(inputError({ kind: 'url', value })).toBe('')
    }
    for (const value of ['', '   ', 'example.com', 'javascript:alert(1)', 'ftp://example.com']) {
      expect(inputError({ kind: 'url', value })).not.toBe('')
    }
  })

  it('preserves text whitespace, line breaks and Unicode exactly', () => {
    const value = '  喫茶くれみ ☕️🌷\nまた来てね！\n'
    expect(encodedValue({ kind: 'text', value })).toBe(value)
    expect(inputError({ kind: 'text', value })).toBe('')
    expect(encodedValue({ kind: 'url', value: ' https://example.com ' })).toBe(
      'https://example.com',
    )
  })

  it('rejects malformed saved settings and keeps snapshots independent', () => {
    const draft = createDraft()
    expect(isDraft(draft)).toBe(true)
    expect(isDraft({ ...draft, version: 2 })).toBe(false)
    expect(isDraft({ ...draft, style: { ...draft.style, dots: 'unknown' } })).toBe(false)
    expect(isDraft({ ...draft, style: { ...draft.style, foreground: 'red' } })).toBe(false)
    expect(isDraft({ ...draft, logo: new Blob(['<svg/>'], { type: 'image/svg+xml' }) })).toBe(false)
    const snapshot = snapshotDraft(draft)
    draft.style.foreground = '#000000'
    expect(snapshot.style.foreground).toBe('#493385')
  })
})
