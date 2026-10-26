import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import {
  createDraft,
  encodedValue,
  generationError,
  inputError,
  presets,
  snapshotDraft,
  type PresetId,
} from '@/lib/qr'
import { downloadArtwork, renderQr, verifyQr, type QrArtwork } from '@/lib/renderer'
import { loadDraft, saveDraft } from '@/lib/storage'

/**
 * 編集状態・QR生成・読み取り検証・作業保存を管理する。
 * 編集の世代番号を照合し、変更前の内容で完了した非同期処理の結果を破棄する。
 */
export function useQrEditor() {
  const draft = reactive(createDraft())
  const artwork = shallowRef<QrArtwork | null>(null)
  const previewUrl = ref('')

  const ready = ref(false)
  const generating = ref(false)
  const exporting = ref(false)

  const error = ref('')
  const logoError = ref('')
  const storageMessage = ref('')
  const downloadMessage = ref('')
  const verification = ref<'idle' | 'checking' | 'passed' | 'warning'>('idle')

  const validationError = computed(() => inputError(draft))

  const canExport = computed(
    () => !!artwork.value && !validationError.value && !generating.value && !exporting.value,
  )

  const selectedPreset = computed(
    () =>
      presets.find((preset) =>
        Object.entries(preset.style).every(
          ([key, value]) => draft.style[key as keyof typeof draft.style] === value,
        ),
      )?.id,
  )

  let revision = 0
  let logoRevision = 0
  let disposed = false
  let renderTimer: ReturnType<typeof setTimeout> | undefined
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let saveQueue = Promise.resolve()

  /** 表示用の画像URLを解放し、前の生成結果を破棄する。 */
  function clearArtwork() {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }

    previewUrl.value = ''
    artwork.value = null
  }

  /** 指定された編集世代のQRコードを生成し、現在の入力と一致する結果だけ反映する。 */
  async function generate(current: number) {
    const snapshot = snapshotDraft(draft)

    try {
      const result = await renderQr(snapshot)

      if (disposed || current !== revision) {
        return
      }

      artwork.value = result
      previewUrl.value = URL.createObjectURL(result.png)
      generating.value = false
      verification.value = 'checking'

      let passed = false

      try {
        passed = await verifyQr(result, encodedValue(snapshot))
      } catch {
        // 読み取り検証に失敗しても、生成済みのQRコードは警告付きで保存できる。
      }

      if (!disposed && current === revision) {
        verification.value = passed ? 'passed' : 'warning'
      }
    } catch (cause) {
      if (disposed || current !== revision) {
        return
      }

      error.value = generationError(cause)
      generating.value = false
    }
  }

  /** 現在の編集内容を複製し、順序を保った保存キューへ追加する。 */
  function persist() {
    const snapshot = snapshotDraft(draft)

    // 古い編集内容が新しい内容を上書きしないよう、保存処理を直列に実行する。
    saveQueue = saveQueue.then(async () => {
      try {
        await saveDraft(snapshot)

        if (!disposed) {
          storageMessage.value = ''
        }
      } catch {
        if (!disposed) {
          storageMessage.value =
            'このブラウザに作業を保存できません。編集とダウンロードはそのまま使えます。'
        }
      }
    })
  }

  /** 連続した編集をまとめ、最後の入力を生成・保存するタイマーを登録する。 */
  function schedule() {
    clearTimeout(renderTimer)
    clearTimeout(saveTimer)
    clearArtwork()

    error.value = ''
    downloadMessage.value = ''
    verification.value = 'idle'
    generating.value = !validationError.value

    if (!ready.value) {
      return
    }

    if (!validationError.value) {
      const current = revision
      renderTimer = setTimeout(() => void generate(current), 200)
    }

    saveTimer = setTimeout(persist, 350)
  }

  watch(
    draft,
    () => {
      revision += 1
      schedule()
    },
    { deep: true, flush: 'sync' },
  )

  onMounted(async () => {
    window.addEventListener('pagehide', flushDraft)
    document.addEventListener('visibilitychange', onVisibilityChange)

    const initialRevision = revision

    try {
      const saved = await loadDraft()

      if (!disposed && revision === initialRevision && saved) {
        Object.assign(draft, saved)
      }
    } catch {
      if (!disposed) {
        storageMessage.value = '前回の作業を復元できませんでした。新しく作成できます。'
      }
    }

    if (!disposed) {
      ready.value = true
      schedule()
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', flushDraft)
    document.removeEventListener('visibilitychange', onVisibilityChange)

    disposed = true
    logoRevision += 1
    clearTimeout(renderTimer)
    clearTimeout(saveTimer)

    if (ready.value) {
      persist()
    }

    clearArtwork()
  })

  /** 保存待ちのタイマーを解除し、ページを離れる前の作業保存を開始する。 */
  function flushDraft() {
    clearTimeout(saveTimer)

    if (ready.value) {
      persist()
    }
  }

  /** 別のタブやアプリへ切り替える際に、編集中の内容を保存する。 */
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      flushDraft()
    }
  }

  /** 指定されたプリセットの装飾を、入力内容とロゴを保持したまま適用する。 */
  function applyPreset(id: PresetId) {
    const preset = presets.find((item) => item.id === id)

    if (preset) {
      draft.style = { ...preset.style }
    }
  }

  /** 画像の形式・容量・読み込みを検証し、選び直しや削除前の画像は反映しない。 */
  async function setLogo(file: File | undefined) {
    const current = ++logoRevision
    logoError.value = ''

    if (!file) {
      return
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      logoError.value = 'PNG・JPEG・WebPの画像を選んでください。'
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      logoError.value = '5MB以下の画像を選んでください。'
      return
    }

    const url = URL.createObjectURL(file)

    try {
      const image = new Image()

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = reject
        image.src = url
      })

      if (!disposed && current === logoRevision) {
        draft.logo = file
      }
    } catch {
      if (!disposed && current === logoRevision) {
        logoError.value = '画像を読み込めませんでした。別の画像を選んでください。'
      }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /** ロゴを削除し、読み込み途中の画像が後から反映されることも防ぐ。 */
  function removeLogo() {
    logoRevision += 1
    draft.logo = null
    logoError.value = ''
  }

  /** 入力内容・装飾・ロゴを、新規作成時の状態へ戻す。 */
  function reset() {
    removeLogo()
    Object.assign(draft, createDraft())
  }

  /** 保存直前に画像を再検証し、その間に編集された場合は古い内容の保存を中止する。 */
  async function download(format: 'png' | 'svg') {
    if (!canExport.value || !artwork.value) {
      return
    }

    const current = revision
    const result = artwork.value
    const expected = encodedValue(draft)

    exporting.value = true
    downloadMessage.value = ''

    try {
      let passed = false

      try {
        passed = await verifyQr(result, expected, format)
      } catch {
        // 読み取り検証の例外が発生しても、書き出しは利用できる状態を保つ。
      }

      if (disposed || current !== revision) {
        if (!disposed) {
          downloadMessage.value =
            '内容が変わったため保存を中止しました。新しいQRを保存してください。'
        }

        return
      }

      verification.value = passed ? 'passed' : 'warning'
      downloadArtwork(result, format)
      downloadMessage.value = `${format.toUpperCase()}を保存しました。`
    } catch {
      downloadMessage.value = '保存できませんでした。もう一度お試しください。'
    } finally {
      if (!disposed) {
        exporting.value = false
      }
    }
  }

  return {
    draft,
    ready,
    previewUrl,
    generating,
    exporting,
    error,
    logoError,
    storageMessage,
    downloadMessage,
    verification,
    validationError,
    canExport,
    selectedPreset,
    applyPreset,
    setLogo,
    removeLogo,
    reset,
    download,
  }
}
