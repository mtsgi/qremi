import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { useQrEditor } from '@/composables/useQrEditor'
import { createDraft } from '@/lib/qr'
import { downloadArtwork, renderQr, verifyQr, type QrArtwork } from '@/lib/renderer'
import { loadDraft, saveDraft } from '@/lib/storage'

vi.mock('@/lib/renderer', () => ({
  renderQr: vi.fn(),
  verifyQr: vi.fn(),
  downloadArtwork: vi.fn(),
}))
vi.mock('@/lib/storage', () => ({ loadDraft: vi.fn(), saveDraft: vi.fn() }))

let wrapper: VueWrapper | undefined

/** 生成処理の成否や順序を検証するための画像データを作成する。 */
function artwork(label = 'qr'): QrArtwork {
  return {
    svg: label,
    png: new Blob([label], { type: 'image/png' }),
    size: 1024,
  }
}

/** 非同期処理の完了順をテスト側から制御できるPromiseを作成する。 */
function deferred<T>() {
  let resolve!: (value: T) => void

  const promise = new Promise<T>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

/** composableのライフサイクルを実行するための最小コンポーネントをマウントする。 */
async function setup() {
  let editor!: ReturnType<typeof useQrEditor>

  wrapper = mount(
    defineComponent({
      setup() {
        editor = useQrEditor()

        return () => null
      },
    }),
  )

  await flushPromises()

  return editor
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()

  vi.mocked(loadDraft).mockResolvedValue(null)
  vi.mocked(saveDraft).mockResolvedValue(undefined)
  vi.mocked(renderQr).mockResolvedValue(artwork())
  vi.mocked(verifyQr).mockResolvedValue(true)

  const NativeURL = globalThis.URL

  vi.stubGlobal(
    'URL',
    class extends NativeURL {
      static createObjectURL = vi.fn(() => 'blob:qremi-test')
      static revokeObjectURL = vi.fn()
    },
  )
})

afterEach(async () => {
  wrapper?.unmount()
  wrapper = undefined

  await flushPromises()

  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('editor lifecycle', () => {
  it('restores the last draft including its logo', async () => {
    const saved = createDraft()
    saved.value = 'https://example.com/last'
    saved.logo = new Blob(['logo'], { type: 'image/png' })
    vi.mocked(loadDraft).mockResolvedValue(saved)

    const editor = await setup()

    expect(editor.draft.value).toBe(saved.value)
    expect(editor.draft.logo).toBe(saved.logo)

    await vi.advanceTimersByTimeAsync(350)

    expect(renderQr).toHaveBeenCalledWith(saved)
    expect(saveDraft).toHaveBeenCalledWith(saved)
  })

  it('does not overwrite input entered while restoration is pending', async () => {
    const pending = deferred<ReturnType<typeof createDraft> | null>()
    vi.mocked(loadDraft).mockReturnValue(pending.promise)

    const editor = await setup()
    editor.draft.value = 'https://example.com/new'
    const saved = createDraft()
    saved.value = 'https://example.com/old'

    pending.resolve(saved)
    await flushPromises()

    expect(editor.draft.value).toBe('https://example.com/new')
  })

  it('discards an old generation that finishes after a newer edit', async () => {
    const first = deferred<QrArtwork>()
    vi.mocked(renderQr).mockReturnValueOnce(first.promise).mockResolvedValueOnce(artwork('new'))

    const editor = await setup()
    editor.draft.value = 'https://example.com/old'
    await vi.advanceTimersByTimeAsync(200)

    editor.draft.value = 'https://example.com/new'
    expect(editor.canExport.value).toBe(false)
    await vi.advanceTimersByTimeAsync(200)
    first.resolve(artwork('old'))
    await flushPromises()
    await editor.download('svg')

    expect(downloadArtwork).toHaveBeenCalledWith(expect.objectContaining({ svg: 'new' }), 'svg')
  })

  it('discards stale verification results', async () => {
    const first = deferred<boolean>()
    vi.mocked(verifyQr).mockReturnValueOnce(first.promise).mockResolvedValueOnce(false)

    const editor = await setup()
    editor.draft.value = 'https://example.com/old'
    await vi.advanceTimersByTimeAsync(200)
    editor.draft.value = 'https://example.com/new'
    await vi.advanceTimersByTimeAsync(200)
    first.resolve(true)
    await flushPromises()

    expect(editor.verification.value).toBe('warning')
  })

  it('allows export after a failed scan and verifies the requested format again', async () => {
    vi.mocked(verifyQr).mockResolvedValue(false)

    const editor = await setup()
    editor.draft.value = 'https://example.com'
    await vi.advanceTimersByTimeAsync(200)
    expect(editor.verification.value).toBe('warning')
    expect(editor.canExport.value).toBe(true)

    await editor.download('svg')

    expect(verifyQr).toHaveBeenLastCalledWith(expect.anything(), 'https://example.com', 'svg')
    expect(downloadArtwork).toHaveBeenCalledOnce()
  })

  it('cancels a pending export when the user edits the content', async () => {
    const editor = await setup()
    editor.draft.value = 'https://example.com'
    await vi.advanceTimersByTimeAsync(200)

    const pending = deferred<boolean>()
    vi.mocked(verifyQr).mockReturnValueOnce(pending.promise)
    const downloading = editor.download('png')

    editor.draft.value = 'https://example.com/changed'
    pending.resolve(true)
    await downloading

    expect(downloadArtwork).not.toHaveBeenCalled()
    expect(editor.downloadMessage.value).toContain('中止')
  })

  it('keeps editing and export available when storage is unavailable', async () => {
    vi.mocked(loadDraft).mockRejectedValue(new Error('unavailable'))
    vi.mocked(saveDraft).mockRejectedValue(new Error('quota'))

    const editor = await setup()
    expect(editor.storageMessage.value).toContain('復元できません')

    editor.draft.value = 'https://example.com'
    await vi.advanceTimersByTimeAsync(350)

    expect(editor.storageMessage.value).toContain('保存できません')
    expect(editor.canExport.value).toBe(true)
  })

  it('reports capacity overflow and blocks export', async () => {
    vi.mocked(renderQr).mockRejectedValue(new Error('code length overflow'))

    const editor = await setup()
    editor.draft.kind = 'text'
    editor.draft.value = '大きな入力'
    await vi.advanceTimersByTimeAsync(200)

    expect(editor.error.value).toContain('入りきりません')
    expect(editor.canExport.value).toBe(false)
  })

  it('rejects unsupported and oversized logos', async () => {
    const editor = await setup()

    await editor.setLogo(new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }))
    expect(editor.logoError.value).toContain('PNG・JPEG・WebP')

    await editor.setLogo(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
    )

    expect(editor.logoError.value).toContain('5MB')
    expect(editor.draft.logo).toBeNull()
  })
})
