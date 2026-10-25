# qremi

Vue 3 app built with [Vite+](https://viteplus.dev/) and [Vize](https://vizejs.dev/guide/vite-plus/index.html).

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) with the workspace's recommended extensions:

- [Vize](https://marketplace.visualstudio.com/items?itemName=ubugeeei.vize) provides Vue type checking, lint, completion, navigation, and formatting.
- Vite+, Oxc, and Vitest provide the remaining tooling. Oxc lints JavaScript/TypeScript, including scripts in Vue files, and formats non-Vue files.

Install the recommended extensions from **Extensions: Show Recommended Extensions**. If Vue - Official (Volar) or Vetur is already installed, select **Disable (Workspace)** for it and reload the window. Vize should be the only Vue language server. Use **Vize: Show Status** to confirm that its language server is available and its features are enabled.

Workspace settings select Vize as the Vue formatter and enable formatting on save. Other languages keep Oxc. Keep the explicit `source.fixAll.oxc` save action; Vize lint fixes are available through diagnostic quick fixes.

The workspace TypeScript package uses [typescript-native-bridge](https://github.com/johnsoncodehk/typescript-native-bridge) for TypeScript tooling. Accept VS Code's prompt to use the workspace TypeScript version, or run **TypeScript: Select TypeScript Version** and choose **Use Workspace Version**. Vize's Vue checks use its own native checker.

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

Vize compiles Vue files and checks the TypeScript projects referenced by `tsconfig.json`, including app code, tests, and tooling configurations. `env.d.ts` references the types provided by Vite+ and Vize for `.vue` imports.

Shared Vue settings live in `vite.config.ts` through `.withVue()`. Vue formatting uses no semicolons and single quotes, matching the Oxfmt settings for other files. Keep TypeScript options and project references in the existing tsconfig files.

The Vize compiler is registered explicitly before DevTools so it also compiles Vue Inspector's overlay in `node_modules`. Keep `compiler: false` on the Vize helper to prevent it from adding a second compiler after DevTools; Vize's check and format tasks remain enabled.

## Customize configuration

See the [Vize Vite+ integration](https://vizejs.dev/guide/vite-plus/index.html) and [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
vp install
```

### Compile and Hot-Reload for Development

```sh
vp run dev
```

### Type-Check, Compile and Minify for Production

```sh
vp run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
vp test --run
```

### Check and Format

| Command                 | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `vp run check`          | Vue type checking, Vize and Oxlint lint, and both format checks |
| `vp run typecheck`      | Type-check the referenced TypeScript projects with Vize         |
| `vp run lint`           | Run Vize and Oxlint lint                                        |
| `vp run fmt:check`      | Check formatting without writing files                          |
| `vp run fmt`            | Format Vue with Vize and other files with Oxfmt                 |
| `vp run format`         | Format only `src/` using both formatters                        |
| `vp run check -- --fix` | Check types, apply lint fixes, and format                       |

Use `vp run check` for the complete check. Built-in `vp check`, `vp lint`, and `vp fmt` do not invoke Vize's tasks. `vp run type-check` remains an alias for `vp run typecheck`; `vp run build` runs this type check alongside the production build.

The pre-commit hook runs `vp staged`, whose staged-file check uses `vp run check -- --fix`. Run `vp run check` before committing to check the whole project.
