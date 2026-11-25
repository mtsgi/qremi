import { fileURLToPath, URL } from 'node:url'

import vize from '@vizejs/vite-plugin'
import { defineConfig } from '@vizejs/vite-plugin/vite-plus'
import { lazyPlugins } from 'vite-plus'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * アプリのビルド、検証、整形をVite+とVizeで統合する。
 * @see https://vizejs.dev/guide/vite-plus/index.html
 */
export default defineConfig({
  // Vue Inspectorの依存SFCもコンパイルできるよう、DevToolsより先にVizeを登録する。
  compiler: false,
  staged: {
    '*.{vue,ts,mts,cts,tsx,js,mjs,cjs,jsx,html,htm,css,json,jsonc,md,yml,yaml}':
      'vp run check -- --fix',
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    semi: false,
    singleQuote: true,
  },
  plugins: lazyPlugins(() => [vize(), vueDevTools()]),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}).withVue({
  fmt: {
    semi: false,
    singleQuote: true,
    singleAttributePerLine: true,
    bracketSameLine: false,
  },
})
