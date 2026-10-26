<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import AppIcon from './components/AppIcon.vue'
import QrPreview from './components/QrPreview.vue'
import StyleControls from './components/StyleControls.vue'
import { useQrEditor } from './composables/useQrEditor'
import { presets } from './lib/qr'

/** ブラウザが保持している、PWAのインストール要求と選択結果。 */
interface InstallPrompt extends Event {
  /** ブラウザ標準のインストール画面を開く。 */
  prompt(): Promise<void>

  /** インストール画面での利用者の選択結果。 */
  userChoice: Promise<{ outcome: string }>
}

const baseUrl = import.meta.env.BASE_URL

const {
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
} = useQrEditor()

const inputTouched = ref(false)
const logoUrl = ref('')

const installDialog = ref<HTMLDialogElement | null>(null)
const resetDialog = ref<HTMLDialogElement | null>(null)

const installed = ref(false)
const isIos = ref(false)
const installPrompt = shallowRef<InstallPrompt | null>(null)

/** プリセットの見た目を示す、小さなQR模様の描画位置。 */
const presetCells = [
  [4, 0],
  [5, 1],
  [4, 2],
  [0, 4],
  [2, 4],
  [4, 4],
  [5, 5],
  [6, 4],
  [8, 4],
  [4, 6],
  [6, 6],
  [8, 6],
  [5, 7],
  [6, 8],
  [8, 8],
]

const hasContent = computed(() => !!draft.value.trim())

watch(
  () => draft.logo,
  (blob) => {
    if (logoUrl.value) {
      URL.revokeObjectURL(logoUrl.value)
    }

    logoUrl.value = blob ? URL.createObjectURL(blob) : ''
  },
  { immediate: true },
)

/** 画像を選び、同じファイルも選び直せるように選択欄を空に戻す。 */
function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  void setLogo(input.files?.[0])
  input.value = ''
}

/** ドロップされた先頭の画像をロゴとして読み込む。 */
function onDrop(event: DragEvent) {
  void setLogo(event.dataTransfer?.files[0])
}

/** ブラウザの自動表示を止め、ヘッダーの操作からインストールできるようにする。 */
function captureInstall(event: Event) {
  event.preventDefault()
  installPrompt.value = event as InstallPrompt
}

/** インストール完了後に案内ボタンの表示を更新する。 */
function onInstalled() {
  installed.value = true
  installPrompt.value = null
}

/** 標準のインストール画面を開き、利用できない場合は操作手順を案内する。 */
async function install() {
  if (!installPrompt.value) {
    installDialog.value?.showModal()
    return
  }

  const prompt = installPrompt.value
  installPrompt.value = null

  try {
    await prompt.prompt()

    if ((await prompt.userChoice).outcome === 'accepted') {
      installed.value = true
    }
  } catch {
    installDialog.value?.showModal()
  }
}

/** 編集内容と入力済みの表示を初期化し、確認ダイアログを閉じる。 */
function resetEditor() {
  reset()
  inputTouched.value = false
  resetDialog.value?.close()
}

onMounted(() => {
  installed.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone
  isIos.value =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  window.addEventListener('beforeinstallprompt', captureInstall)
  window.addEventListener('appinstalled', onInstalled)
})

onBeforeUnmount(() => {
  if (logoUrl.value) {
    URL.revokeObjectURL(logoUrl.value)
  }

  window.removeEventListener('beforeinstallprompt', captureInstall)
  window.removeEventListener('appinstalled', onInstalled)
})
</script>

<template>
  <a
    class="skip-link"
    href="#editor"
  >
    QRコードの編集へ
  </a>
  <header class="site-header">
    <div class="brand-lockup">
      <a
        aria-label="Qremi ホーム"
        class="brand"
        href="./"
      >
        <img
          alt="Qremi"
          height="40"
          :src="`${baseUrl}qremi-brand-assets/qremi-logo-primary.svg`"
          width="134"
        />
      </a>
      <h1
        id="page-heading"
        class="brand-tagline"
      >
        MAKE YOUR QR YOURS.
      </h1>
    </div>
    <button
      v-if="!installed"
      class="button install-button"
      type="button"
      @click="install"
    >
      <AppIcon
        name="phone"
        :size="17"
      />
      <span>アプリとして使う</span>
    </button>
    <span
      v-else
      class="installed-label"
    >
      <AppIcon
        name="check"
        :size="16"
      />
      インストール済み
    </span>
  </header>
  <main aria-labelledby="page-heading">
    <div class="workspace">
      <section
        id="editor"
        aria-label="QRコードを編集"
        class="editor-card card"
      >
        <div class="editor-section content-section">
          <div class="section-heading">
            <span class="step-number">01</span>
            <div>
              <h2>何を届けますか？</h2>
              <p>QRコードにしたい内容を入力</p>
            </div>
          </div>
          <div
            aria-label="入力する内容の種類"
            class="input-tabs"
          >
            <button
              type="button"
              :aria-pressed="draft.kind === 'url'"
              :class="{ active: draft.kind === 'url' }"
              @click="draft.kind = 'url'"
            >
              <AppIcon
                name="link"
                :size="17"
              />
              URL
            </button>
            <button
              type="button"
              :aria-pressed="draft.kind === 'text'"
              :class="{ active: draft.kind === 'text' }"
              @click="draft.kind = 'text'"
            >
              <AppIcon
                name="text"
                :size="17"
              />
              テキスト
            </button>
          </div>
          <label
            class="input-label"
            for="qr-content"
          >
            {{
              draft.kind === 'url' ? 'リンク先のURL' : '届けたいテキスト'
            }}
          </label>
          <div class="content-input-wrap">
            <AppIcon
              v-if="draft.kind === 'url'"
              class="input-icon"
              name="link"
              :size="19"
            />
            <input
              v-if="draft.kind === 'url'"
              id="qr-content"
              v-model="draft.value"
              autocapitalize="off"
              autocomplete="url"
              class="content-input url-input"
              inputmode="url"
              placeholder="https://example.com"
              type="url"
              :spellcheck="false"
              :aria-invalid="inputTouched && !!validationError"
              aria-describedby="input-hint"
              @blur="inputTouched = true"
            />
            <textarea
              v-else
              id="qr-content"
              v-model="draft.value"
              class="content-input"
              placeholder="メッセージや、お知らせをどうぞ。"
              rows="4"
              :aria-invalid="inputTouched && !!validationError"
              aria-describedby="input-hint"
              @blur="inputTouched = true"
            />
          </div>
          <p
            id="input-hint"
            class="field-hint"
            :class="{ 'field-error': inputTouched && validationError }"
          >
            {{
              inputTouched && validationError
                ? validationError
                : draft.kind === 'url'
                  ? 'お店のサイト、SNS、作品のリンクなど。'
                  : '日本語・絵文字・改行も、そのままQRコードに。'
            }}
          </p>
        </div>
        <div class="editor-section design-section">
          <div class="section-heading">
            <span class="step-number">02</span>
            <div>
              <h2>好きな雰囲気を選んで</h2>
              <p>まずは、ぴったりのデザインから</p>
            </div>
            <AppIcon
              class="heading-sparkle"
              name="sparkles"
              :size="23"
            />
          </div>
          <div
            aria-label="デザインのプリセット"
            class="presets"
          >
            <button
              v-for="preset in presets"
              :key="preset.id"
              class="preset"
              type="button"
              :class="{ selected: selectedPreset === preset.id }"
              :aria-pressed="selectedPreset === preset.id"
              @click="applyPreset(preset.id)"
            >
              <span
                class="preset-art"
                :class="`preset-${preset.id}`"
                aria-hidden="true"
              >
                <svg
                  fill="currentColor"
                  height="62"
                  viewBox="0 0 90 90"
                  width="62"
                >
                  <g
                    v-for="(position, index) in [[0, 0], [60, 0], [0, 60]]"
                    :key="index"
                  >
                    <rect
                      :x="position[0]"
                      :y="position[1]"
                      height="30"
                      width="30"
                      :rx="preset.id === 'simple' ? 0 : 9"
                    />
                    <rect
                      :x="(position[0] ?? 0) + 6"
                      :y="(position[1] ?? 0) + 6"
                      fill="white"
                      height="18"
                      width="18"
                      :rx="preset.id === 'simple' ? 0 : 4"
                    />
                    <rect
                      :x="(position[0] ?? 0) + 11"
                      :y="(position[1] ?? 0) + 11"
                      height="8"
                      width="8"
                      :rx="preset.id === 'simple' ? 0 : 3"
                    />
                  </g>
                  <rect
                    v-for="(cell, index) in presetCells"
                    :key="`dot-${index}`"
                    :x="(cell[0] ?? 0) * 10"
                    :y="(cell[1] ?? 0) * 10"
                    height="8"
                    width="8"
                    :rx="preset.id === 'simple' ? 0 : preset.id === 'soft' ? 2 : 4"
                  />
                </svg>
                <span
                  v-if="selectedPreset === preset.id"
                  class="preset-check"
                >
                  <AppIcon
                    name="check"
                    :size="12"
                  />
                </span>
              </span>
              <span class="preset-name">{{ preset.name }}</span>
              <span class="sr-only">{{ preset.description }}</span>
            </button>
          </div>
          <StyleControls v-model="draft.style" />
          <details class="detail-section logo-section">
            <summary>
              <span class="summary-label">
                <AppIcon name="image" />
                ロゴを添える
                <span
                  v-if="draft.logo"
                  class="small-tag"
                >
                  追加済み
                </span>
                <span
                  v-else
                  class="optional-label"
                >
                  お好みで
                </span>
              </span>
              <AppIcon
                name="chevron"
                :size="18"
              />
            </summary>
            <div class="detail-content">
              <div
                v-if="logoUrl"
                class="logo-added"
              >
                <img
                  :src="logoUrl"
                  alt="追加したロゴ"
                  height="48"
                  width="48"
                />
                <div>
                  <strong>ロゴを追加しました</strong>
                  <p>中央に配置されます</p>
                </div>
                <button
                  aria-label="ロゴを削除"
                  class="icon-button"
                  type="button"
                  @click="removeLogo"
                >
                  <AppIcon
                    name="close"
                    :size="18"
                  />
                </button>
              </div>
              <label
                class="upload-area"
                @dragover.prevent
                @drop.prevent="onDrop"
              >
                <input
                  accept="image/png,image/jpeg,image/webp"
                  class="sr-only"
                  type="file"
                  @change="onFile"
                />
                <AppIcon
                  name="upload"
                  :size="21"
                />
                <span>{{
                  draft.logo ? '別の画像を選ぶ' : '画像を選ぶ、またはここにドロップ'
                }}</span>
                <small>PNG・JPEG・WebP ／ 5MBまで</small>
              </label>
              <label
                v-if="draft.logo"
                class="logo-size-label"
                for="logo-scale"
              >
                ロゴの大きさ
                <span>
                  小さめ
                  <input
                    id="logo-scale"
                    v-model.number="draft.style.logoScale"
                    max="0.6"
                    min="0.2"
                    step="0.05"
                    type="range"
                  />
                  大きめ
                </span>
              </label>
              <p
                v-if="logoError"
                class="field-error"
                role="alert"
              >
                {{ logoError }}
              </p>
              <p class="field-hint">ロゴ入りの場合、QRの読み取りを補う設定を自動で適用します。</p>
            </div>
          </details>
        </div>
        <div class="editor-bottom">
          <span>
            <AppIcon
              name="shield"
              :size="15"
            />
            作業はこのブラウザに自動保存
          </span>
          <button
            class="text-button"
            type="button"
            @click="resetDialog?.showModal()"
          >
            <AppIcon
              name="reset"
              :size="14"
            />
            最初から
          </button>
        </div>
        <p
          v-if="storageMessage"
          class="storage-notice"
          role="status"
        >
          {{ storageMessage }}
        </p>
        <p
          v-if="!ready"
          class="sr-only"
          role="status"
        >
          前回の作業を確認しています。
        </p>
      </section>
      <div class="preview-column">
        <QrPreview
          v-model:size="draft.size"
          :preview-url="previewUrl"
          :generating="generating"
          :exporting="exporting"
          :error="error"
          :validation-error="validationError"
          :has-content="hasContent"
          :can-export="canExport"
          :verification="verification"
          :message="downloadMessage"
          @download="download"
        />
        <div class="privacy-note">
          <AppIcon
            name="shield"
            :size="19"
          />
          <p>
            あなたの内容は、あなたの端末に。
            <span>入力内容やロゴをサーバーへ送信しません。</span>
          </p>
        </div>
      </div>
    </div>
    <section
      aria-label="Qremiの使い方"
      class="how-it-works"
    >
      <div>
        <span>1</span>
        内容を入力
      </div>
      <AppIcon
        name="arrow"
        :size="16"
      />
      <div>
        <span>2</span>
        あなた好みに
      </div>
      <AppIcon
        name="arrow"
        :size="16"
      />
      <div>
        <span>3</span>
        保存して使う
      </div>
    </section>
  </main>
  <footer class="site-footer">
    <div>
      <img
        alt=""
        height="20"
        :src="`${baseUrl}qremi-brand-assets/qremi-symbol-primary.svg`"
        width="20"
      />
      <span>Qremi</span>
      <span class="footer-tagline">Make your QR yours.</span>
    </div>
    <p>毎日の「伝えたい」に、ちょっと個性を。</p>
  </footer>
  <a
    class="mobile-preview-link"
    href="#preview"
  >
    <AppIcon
      name="sparkles"
      :size="17"
    />
    プレビュー・保存へ
    <AppIcon
      name="arrow"
      :size="17"
    />
  </a>
  <dialog
    ref="installDialog"
    aria-labelledby="install-title"
    class="app-dialog"
  >
    <button
      aria-label="閉じる"
      class="dialog-close icon-button"
      type="button"
      @click="installDialog?.close()"
    >
      <AppIcon name="close" />
    </button>
    <img
      alt=""
      height="64"
      :src="`${baseUrl}qremi-brand-assets/qremi-icon-192.png`"
      width="64"
    />
    <h2 id="install-title">Qremiを、いつもそばに。</h2>
    <p>
      ホーム画面やデスクトップに追加して、
      <br />
      アプリのように使えます。
    </p>
    <div class="install-instructions">
      <template v-if="isIos">
        <strong>iPhone・iPadの場合</strong>
        <p>
          Safariの共有メニューから
          <br />
          「ホーム画面に追加」を選んでください。
        </p>
      </template>
      <template v-else>
        <strong>Chrome・Edgeの場合</strong>
        <p>
          ブラウザのメニューから
          <br />
          「Qremiをインストール」または
          <br />
          「アプリをインストール」を選んでください。
        </p>
      </template>
    </div>
    <p class="field-hint">
      対応するブラウザでご利用ください。
      <br />
      起動時にはインターネット接続が必要です。
    </p>
    <button
      class="button primary-button dialog-done"
      type="button"
      @click="installDialog?.close()"
    >
      わかりました
    </button>
  </dialog>
  <dialog
    ref="resetDialog"
    aria-labelledby="reset-title"
    class="app-dialog"
  >
    <h2 id="reset-title">最初から作りますか？</h2>
    <p>入力内容・デザイン・ロゴがリセットされます。</p>
    <div class="dialog-actions">
      <button
        class="button secondary-button"
        type="button"
        @click="resetDialog?.close()"
      >
        キャンセル
      </button>
      <button
        class="button primary-button"
        type="button"
        @click="resetEditor"
      >
        最初から作る
      </button>
    </div>
  </dialog>
</template>
