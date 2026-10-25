import { fileURLToPath, URL } from 'node:url'

import vize from '@vizejs/vite-plugin'
import { defineConfig } from '@vizejs/vite-plugin/vite-plus'
import { lazyPlugins } from 'vite-plus'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vizejs.dev/guide/vite-plus/index.html
export default defineConfig({
  // Register Vize before DevTools so it compiles Vue Inspector's dependency SFCs.
  compiler: false,
  staged: {
    '*': 'vp run check -- --fix',
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
  },
})
