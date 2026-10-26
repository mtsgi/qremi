<script setup lang="ts">
import type { QrStyle } from '@/lib/qr'
import AppIcon from './AppIcon.vue'

/** 親の編集データと同期する、配色・形状の設定。 */
const styleModel = defineModel<QrStyle>({ required: true })
</script>

<template>
  <details class="detail-section">
    <summary>
      <span class="summary-label">
        <AppIcon name="palette" />
        もう少し、自分好みに
      </span>
      <AppIcon
        name="chevron"
        :size="18"
      />
    </summary>
    <div class="detail-content">
      <div class="color-fields">
        <label class="color-field">
          <span>QRの色</span>
          <span class="color-control">
            <input
              v-model="styleModel.foreground"
              type="color"
            />
            <span>{{ styleModel.foreground.toUpperCase() }}</span>
          </span>
        </label>
        <label class="color-field">
          <span>背景の色</span>
          <span class="color-control">
            <input
              v-model="styleModel.background"
              type="color"
            />
            <span>{{ styleModel.background.toUpperCase() }}</span>
          </span>
        </label>
      </div>
      <label class="switch-row">
        <span>グラデーションにする</span>
        <input
          v-model="styleModel.gradient"
          class="switch"
          type="checkbox"
        />
      </label>
      <label
        v-if="styleModel.gradient"
        class="color-field gradient-field"
      >
        <span>グラデーションの終わりの色</span>
        <span class="color-control">
          <input
            v-model="styleModel.gradientEnd"
            type="color"
          />
          <span>{{ styleModel.gradientEnd.toUpperCase() }}</span>
        </span>
      </label>
      <div class="select-fields">
        <label>
          ドットの形
          <select v-model="styleModel.dots">
            <option value="square">四角</option>
            <option value="rounded">まるみ</option>
            <option value="dot">ドット</option>
          </select>
        </label>
        <label>
          角の形
          <select v-model="styleModel.corners">
            <option value="square">四角</option>
            <option value="extra-rounded">角まる</option>
            <option value="dot">まる</option>
          </select>
        </label>
      </div>
      <p class="field-hint">濃い色のQRと明るい背景にすると、読み取りやすくなります。</p>
    </div>
  </details>
</template>
