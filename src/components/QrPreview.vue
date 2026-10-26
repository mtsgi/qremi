<script setup lang="ts">
import type { ExportSize } from '@/lib/qr'
import AppIcon from './AppIcon.vue'

/** プレビュー画像、生成状況、書き出し可否を表示するための情報。 */
interface Props {
  /** 表示するPNG画像の一時URL。 */
  previewUrl: string

  /** 画像を生成しているか。 */
  generating: boolean

  /** ファイルの保存を準備しているか。 */
  exporting: boolean

  /** 生成処理の失敗時に表示するメッセージ。 */
  error: string

  /** 入力内容の検証で見つかった問題。 */
  validationError: string

  /** 空白以外の入力があるか。 */
  hasContent: boolean

  /** 現在の画像を書き出せるか。 */
  canExport: boolean

  /** 画像の読み取り確認の進行状況と結果。 */
  verification: 'idle' | 'checking' | 'passed' | 'warning'

  /** 保存完了や中止についての案内。 */
  message: string
}

/** プレビューから親の編集処理へ伝える操作。 */
interface PreviewEvents {
  /** 指定形式でのファイル保存を要求する。 */
  download: [format: 'png' | 'svg']
}

const baseUrl = import.meta.env.BASE_URL

defineProps<Props>()

/** 親の編集データと同期する書き出しサイズ。 */
const size = defineModel<ExportSize>('size', { required: true })

defineEmits<PreviewEvents>()
</script>

<template>
  <section
    id="preview"
    aria-labelledby="preview-heading"
    class="preview-card card"
  >
    <div class="preview-heading-row">
      <div>
        <p class="eyebrow">A LITTLE MORE YOU</p>
        <h2 id="preview-heading">あなたのQRコード</h2>
      </div>
      <span class="live-badge">
        <span />
        LIVE
      </span>
    </div>
    <div
      class="preview-stage"
      :aria-busy="generating"
    >
      <div
        aria-hidden="true"
        class="stage-sparkle sparkle-one"
      >
        ✦
      </div>
      <div
        aria-hidden="true"
        class="stage-sparkle sparkle-two"
      >
        ✧
      </div>
      <div class="qr-paper">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="作成したQRコード"
          class="qr-image"
          :width="size"
          :height="size"
        />
        <div
          v-else
          class="empty-preview"
        >
          <span
            aria-hidden="true"
            class="finder finder-a"
          />
          <span
            aria-hidden="true"
            class="finder finder-b"
          />
          <span
            aria-hidden="true"
            class="finder finder-c"
          />
          <span
            v-if="generating"
            aria-hidden="true"
            class="spinner"
          />
          <img
            v-else
            alt=""
            height="64"
            :src="`${baseUrl}qremi-brand-assets/qremi-symbol-primary.svg`"
            width="64"
          />
          <p>{{ generating ? 'あなたのQRを作成中…' : 'ここから、あなたらしく。' }}</p>
          <span v-if="!generating">
            内容を入力すると
            <br />
            QRコードが表示されます
          </span>
        </div>
      </div>
      <span class="preview-caption">Make your QR yours.</span>
    </div>
    <div
      aria-atomic="true"
      aria-live="polite"
      class="verification-area"
    >
      <p
        v-if="error || (hasContent && validationError)"
        class="notice error-notice"
      >
        <AppIcon name="info" />
        <span>{{ error || validationError }}</span>
      </p>
      <p
        v-else-if="verification === 'passed'"
        class="notice success-notice"
      >
        <AppIcon
          name="check"
          :size="18"
        />
        <span>画像の読み取りを確認しました</span>
      </p>
      <p
        v-else-if="verification === 'warning'"
        class="notice warning-notice"
      >
        <AppIcon name="info" />
        <span>
          読み取りを確認できませんでした。色を濃くしたり、ロゴを小さくしてみてください。保存はできます。
        </span>
      </p>
      <p
        v-else-if="verification === 'checking'"
        class="notice neutral-notice"
      >
        <span class="spinner small" />
        <span>画像の読み取りを確認中…</span>
      </p>
      <p
        v-else
        class="notice neutral-notice"
      >
        <AppIcon
          name="sparkles"
          :size="18"
        />
        <span>{{
          generating ? 'デザインを反映しています' : '入力しながら、仕上がりをチェック'
        }}</span>
      </p>
    </div>
    <div class="export-section">
      <label
        class="size-row"
        for="export-size"
      >
        <span>画像のサイズ</span>
        <select
          id="export-size"
          v-model="size"
        >
          <option :value="512">512 × 512 px</option>
          <option :value="1024">1024 × 1024 px</option>
          <option :value="2048">2048 × 2048 px</option>
        </select>
      </label>
      <div class="download-buttons">
        <button
          class="button primary-button"
          type="button"
          :disabled="!canExport"
          @click="$emit('download', 'png')"
        >
          <AppIcon name="download" />
          <span>
            {{ exporting ? '保存を準備中…' : 'PNGで保存' }}
            <small>画像・SNSに</small>
          </span>
        </button>
        <button
          class="button secondary-button"
          type="button"
          :disabled="!canExport"
          @click="$emit('download', 'svg')"
        >
          <AppIcon name="download" />
          <span>
            SVGで保存
            <small>拡大・印刷に</small>
          </span>
        </button>
      </div>
      <p
        aria-live="polite"
        class="download-message"
      >
        {{
          message || 'ロゴも含めて、1つのファイルに。'
        }}
      </p>
    </div>
    <p class="print-note">
      <AppIcon
        name="info"
        :size="15"
      />
      <span>印刷前には、実際のサイズでスマートフォンから読み取りをお試しください。</span>
    </p>
  </section>
</template>
