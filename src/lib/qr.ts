/** QRコードに格納する内容の入力種別。 */
export type InputKind = 'url' | 'text'

/** 書き出す画像の一辺のピクセル数。 */
export type ExportSize = 512 | 1024 | 2048

/** QRコードのデータ部分に使うドットの形。 */
export type DotStyle = 'square' | 'rounded' | 'dot'

/** QRコードの位置を示す、隅の目印の形。 */
export type CornerStyle = 'square' | 'extra-rounded' | 'dot'

/** 編集画面から選択できるデザインの識別子。 */
export type PresetId = 'simple' | 'soft' | 'purple'

/** QRコードの配色・形状・中央ロゴの装飾設定。 */
export interface QrStyle {
  /** ドットと隅の目印に適用する基本色。 */
  foreground: string

  /** 余白を含むQR画像全体の背景色。 */
  background: string

  /** データ部分にグラデーションを適用するか。 */
  gradient: boolean

  /** 基本色から変化するグラデーションの終点色。 */
  gradientEnd: string

  /** データ部分のドットの形。 */
  dots: DotStyle

  /** 隅の目印の形。 */
  corners: CornerStyle

  /** 誤り訂正レベルに応じたロゴの配置可能領域に対するサイズ係数。 */
  logoScale: number
}

/** 前回の作業として保存・復元する、入力内容・装飾・ロゴの編集データ。 */
export interface QrDraft {
  /** 保存データの形式を識別するバージョン。 */
  version: 1

  /** URLとテキストのどちらとして入力を扱うか。 */
  kind: InputKind

  /** QRコードへ格納する前の入力文字列。 */
  value: string

  /** PNGとSVGの書き出しサイズ。 */
  size: ExportSize

  /** 現在の配色と形状の設定。 */
  style: QrStyle

  /** 中央に配置する画像。ロゴを使わない場合はnull。 */
  logo: Blob | null
}

/** 選択肢の表示情報と、適用する装飾設定をまとめたプリセット。 */
export interface QrPreset {
  /** 選択中のプリセットを判別する識別子。 */
  id: PresetId

  /** 編集画面に表示する名前。 */
  name: string

  /** プリセットの雰囲気を伝える説明。 */
  description: string

  /** 選択時にまとめて適用する装飾設定。 */
  style: QrStyle
}

/** 初期デザインの作成と、編集画面のプリセット選択に使用する設定一覧。 */
export const presets: QrPreset[] = [
  {
    id: 'simple',
    name: 'シンプル',
    description: 'すっきり、どこにでも。',
    style: {
      foreground: '#493385',
      background: '#ffffff',
      gradient: false,
      gradientEnd: '#8b5cb8',
      dots: 'square',
      corners: 'square',
      logoScale: 0.35,
    },
  },
  {
    id: 'soft',
    name: 'まるみ',
    description: 'やさしく、親しみやすく。',
    style: {
      foreground: '#493385',
      background: '#ffffff',
      gradient: false,
      gradientEnd: '#8b5cb8',
      dots: 'rounded',
      corners: 'extra-rounded',
      logoScale: 0.35,
    },
  },
  {
    id: 'purple',
    name: 'パープル',
    description: 'ほんのり、あなたらしく。',
    style: {
      foreground: '#493385',
      background: '#ffffff',
      gradient: true,
      gradientEnd: '#8b5cb8',
      dots: 'rounded',
      corners: 'extra-rounded',
      logoScale: 0.35,
    },
  },
]

/** URL入力・1024px・シンプルな配色を初期値にした編集データを作成する。 */
export function createDraft(): QrDraft {
  return {
    version: 1,
    kind: 'url',
    value: '',
    size: 1024,
    style: { ...presets[0]!.style },
    logo: null,
  }
}

/**
 * 非同期処理中の編集による影響を防ぐため、装飾設定を複製する。
 * ロゴのBlobは内容が変更されないため、そのまま共有する。
 */
export function snapshotDraft(draft: QrDraft): QrDraft {
  return { ...draft, style: { ...draft.style } }
}

/**
 * 入力種別に応じて、空入力とHTTP／HTTPS以外のURLを検証する。
 * @returns 入力が有効な場合は空文字列、不正な場合は利用者向けのエラーメッセージ。
 */
export function inputError(draft: Pick<QrDraft, 'kind' | 'value'>): string {
  if (!draft.value.trim()) {
    return draft.kind === 'url' ? 'URLを入力してください。' : 'テキストを入力してください。'
  }

  if (draft.kind === 'text') {
    return ''
  }

  try {
    const url = new URL(draft.value.trim())

    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname) {
      return ''
    }
  } catch {
    // スキームの欠落とURLの形式不正には、共通の修正案を案内する。
  }

  return 'https:// または http:// で始まるURLを入力してください。'
}

/** URLの前後の空白を除去し、テキストの空白・改行・絵文字はそのまま保持する。 */
export function encodedValue(draft: Pick<QrDraft, 'kind' | 'value'>): string {
  return draft.kind === 'url' ? draft.value.trim() : draft.value
}

const colorPattern = /^#[\da-f]{6}$/i

/** 保存データの形式と設定値を検証し、現在の編集データとして復元できるかを判定する。 */
export function isDraft(value: unknown): value is QrDraft {
  if (!value || typeof value !== 'object') {
    return false
  }

  const draft = value as Partial<QrDraft>
  const style = draft.style

  return (
    draft.version === 1 &&
    (draft.kind === 'url' || draft.kind === 'text') &&
    typeof draft.value === 'string' &&
    [512, 1024, 2048].includes(draft.size ?? 0) &&
    !!style &&
    colorPattern.test(style.foreground) &&
    colorPattern.test(style.background) &&
    colorPattern.test(style.gradientEnd) &&
    typeof style.gradient === 'boolean' &&
    ['square', 'rounded', 'dot'].includes(style.dots) &&
    ['square', 'extra-rounded', 'dot'].includes(style.corners) &&
    typeof style.logoScale === 'number' &&
    style.logoScale >= 0.2 &&
    style.logoScale <= 0.6 &&
    (draft.logo === null ||
      (draft.logo instanceof Blob &&
        ['image/png', 'image/jpeg', 'image/webp'].includes(draft.logo.type)))
  )
}

/** QRコード生成時の例外を、容量超過などの原因に応じた日本語の案内に変換する。 */
export function generationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (/overflow|too (?:big|long)|length|capacity|容量/i.test(message)) {
    return '内容がQRコードに入りきりません。テキストやURLを短くしてみてください。'
  }

  return 'QRコードを作成できませんでした。内容やロゴを確認して、もう一度お試しください。'
}
