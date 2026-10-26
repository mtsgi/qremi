<script setup lang="ts">
/** 共通の線画アイコンに渡す名前と表示サイズ。 */
interface Props {
  /** 描画するアイコンの名前。 */
  name: string

  /** アイコンの一辺のピクセル数。省略時は20px。 */
  size?: number
}

withDefaults(defineProps<Props>(), { size: 20 })

/** 24×24の座標系で定義した、アプリ内の線画アイコン。 */
const paths: Record<string, string> = {
  link: 'M10 13a5 5 0 0 0 7 .2l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7-.2l-3 3a5 5 0 0 0 7 7l2-2',
  text: 'M4 5h16 M12 5v15 M8 20h8',
  download: 'M12 3v12 m-5-5 5 5 5-5 M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5',
  sparkles: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3 M21 2v4 M19 4h4',
  arrow: 'M5 12h14 m-5-5 5 5-5 5',
  chevron: 'm6 9 6 6 6-6',
  check: 'm5 12 4 4L19 6',
  shield: 'M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7l-9-4 m-4 9 3 3 5-5',
  image:
    'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1 M3 16l6-6 5 5 3-3 4 4 M15 7h.01',
  upload: 'M12 16V3 m-5 5 5-5 5 5 M4 16v5h16v-5',
  close: 'm6 6 12 12 M6 18 18 6',
  reset: 'M3 10a9 9 0 1 1 1 7 M3 4v6h6',
  info: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  palette:
    'M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 1-3.7 1.3 1.3 0 0 1 .7-2.3H18a4 4 0 0 0 4-4c0-5-5-8-10-8 M7 9h.01 M10 6h.01 M15 6h.01 M18 9h.01',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2 M10 18h4',
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="1.7"
    viewBox="0 0 24 24"
  >
    <path :d="paths[name] || paths.sparkles" />
  </svg>
</template>
