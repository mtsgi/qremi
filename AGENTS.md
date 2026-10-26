<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Vize integration

- Use `defineConfig` from `@vizejs/vite-plugin/vite-plus` for the app configuration. Keep shared Vue options in `.withVue()` and TypeScript project settings in the existing tsconfig files.
- Keep the explicit `vize()` plugin before `vueDevTools()` so Vue Inspector's dependency SFCs are compiled. `compiler: false` disables only the helper's automatic compiler registration, avoiding a duplicate compiler after DevTools.
- Vize owns Vue compilation, type checking, native lint, and Vue formatting. Preserve Oxc for JavaScript/TypeScript lint (including Vue scripts) and non-Vue formatting, and Vitest for tests.
- Run `vp run check` for the complete check. Built-in `vp check`, `vp lint`, and `vp fmt` do not run Vize's generated tasks; `vp check` alone is insufficient for this project.
- Focused checks are `vp run typecheck`, `vp run lint`, and `vp run fmt:check`. Apply fixes with `vp run check -- --fix`. The pre-commit hook uses this task for staged files.
- Validate changes with `vp run check`, `vp check`, `vp test --run`, and `vp run build`. Confirm formatting is stable with `vp run fmt:check`.
- VS Code uses the recommended Vize extension for all Vue language features and formatting. Keep the Vite+, Oxc, and Vitest extensions. Disable Vue - Official (Volar) and Vetur for this workspace if installed to avoid duplicate Vue language services.

## コード内のドキュメント

- JSDocおよび説明コメントは日本語で記述する。
- exportする関数・型・定数とinterfaceには、役割や利用時の注意が分かるJSDocを付ける。
- 宣言、条件分岐、非同期処理などのまとまりの間に空行を入れ、複数の処理を詰め込まない。
- Vueテンプレートは親子要素や属性を適切に改行し、フォーマット後も読みやすい配置を保つ。
