import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitorのネイティブアプリ設定。
 * ローカル生成した`dist`を同梱し、Androidのシステムバー領域を避けて表示する。
 * `appId`は公開前に確定する暫定ID。
 */
const config: CapacitorConfig = {
  appId: 'com.mtsgi.qremi',
  appName: 'Qremi',
  webDir: 'dist',
  backgroundColor: '#f7f4fb',
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'LIGHT',
    },
  },
}

export default config
