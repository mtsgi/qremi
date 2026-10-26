import { encodedValue, type QrDraft } from './qr'

/** 同じ編集内容から生成した、SVG・PNGと画像サイズの組み合わせ。 */
export interface QrArtwork {
  /** ロゴを埋め込んだ、単独ファイルとして保存できるSVG文字列。 */
  svg: string

  /** プレビューとPNG書き出しで共有する画像。 */
  png: Blob

  /** 生成画像の一辺のピクセル数。 */
  size: number
}

/**
 * SVGを指定サイズの正方形Canvasに描画する。
 * @param svg ロゴを含む画像が埋め込まれたSVG文字列。
 * @param size 出力画像の一辺のピクセル数。
 */
export async function rasterizeSvg(svg: string, size: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))

  try {
    const image = new Image()

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('QR画像を読み込めませんでした。'))
      image.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('画像の作成に対応していません。')
    }

    context.drawImage(image, 0, 0, size, size)

    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * UTF-8と四辺4モジュールの余白を指定し、ロゴを埋め込んだ単独のSVGを生成する。
 * ロゴがある場合は、誤り訂正レベルをHに引き上げる。
 * @throws 内容が容量を超えた場合や、ロゴを読み込めない場合。
 */
export async function renderSvg(draft: QrDraft): Promise<string> {
  const { QRCodeStyling } = await import('@liquid-js/qr-code-styling')
  const style = draft.style

  const qr = new QRCodeStyling({
    data: encodedValue(draft),
    qrOptions: { mode: 'unicode', errorCorrectionLevel: draft.logo ? 'H' : 'Q' },
    shape: 'square',
    dotsOptions: {
      type: style.dots,
      color: style.foreground,
      gradient: style.gradient
        ? {
            type: 'linear',
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: style.foreground },
              { offset: 1, color: style.gradientEnd },
            ],
          }
        : undefined,
    },
    cornersSquareOptions: { type: style.corners, color: style.foreground },
    cornersDotOptions: {
      type:
        style.corners === 'dot' ? 'dot' : style.corners === 'square' ? 'square' : 'extra-rounded',
      color: style.foreground,
    },
    backgroundOptions: { color: style.background, margin: 4 },
    image: draft.logo ?? undefined,
    imageOptions: { mode: 'center', imageSize: style.logoScale, margin: 1 },
  })

  const source = await qr.serialize()

  if (!source) {
    throw new Error('QR画像が空です。')
  }

  const document = new DOMParser().parseFromString(source, 'image/svg+xml')
  const svgElement = document.documentElement
  svgElement.setAttribute('width', String(draft.size))
  svgElement.setAttribute('height', String(draft.size))

  return new XMLSerializer().serializeToString(svgElement)
}

/** 同じSVGからPNGを作成し、プレビューと書き出しで共有する生成結果を返す。 */
export async function renderQr(draft: QrDraft): Promise<QrArtwork> {
  const svg = await renderSvg(draft)
  const canvas = await rasterizeSvg(svg, draft.size)

  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNGを作成できませんでした。'))),
      'image/png',
    )
  })

  return { svg, png, size: draft.size }
}

/**
 * 指定形式の画像を読み戻し、元の入力内容と一致するかを確認する。
 * @param artwork 検証対象の生成結果。
 * @param expected QRコードに格納した文字列。
 * @param format SVGの場合は改めて描画した画像、PNGの場合は生成済みの画像を使う。
 * @returns 内容が一致した場合はtrue、読み取り失敗や内容の不一致はfalse。
 */
export async function verifyQr(
  artwork: QrArtwork,
  expected: string,
  format: 'png' | 'svg' = 'png',
): Promise<boolean> {
  const { default: QrScanner } = await import('qr-scanner')
  const image = format === 'svg' ? await rasterizeSvg(artwork.svg, artwork.size) : artwork.png

  try {
    const scanSize = Math.min(artwork.size, 1024)
    const result = await QrScanner.scanImage(image, {
      returnDetailedScanResult: true,
      scanRegion: {
        x: 0,
        y: 0,
        width: artwork.size,
        height: artwork.size,
        downScaledWidth: scanSize,
        downScaledHeight: scanSize,
      },
      alsoTryWithoutScanRegion: true,
    })

    return result.data === expected
  } catch {
    return false
  }
}

/** 生成結果を指定形式でダウンロードし、保存に使った画像URLを後から解放する。 */
export function downloadArtwork(artwork: QrArtwork, format: 'png' | 'svg'): void {
  const blob =
    format === 'png'
      ? artwork.png
      : new Blob([artwork.svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `qremi-${artwork.size}.${format}`

  document.body.append(link)
  link.click()
  link.remove()

  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
