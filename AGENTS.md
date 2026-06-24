# MyDay_Vue3 — Agent 指南

## 开发环境
- **包管理器**：`bun`（不要用 npm/pnpm）。使用 `bun install`、`bun dev`、`bun run build`。
- **Node**：^20.19.0 或 >=22.12.0
- **TypeScript** ~6.0，**Vite** ^8.0，**Vue** ^3.5，**Vue Router** ^5.0，**Pinia** ^3.0

## 关键命令
| 命令 | 作用 |
|---|---|
| `bun dev` | 启动 Vite 开发服务器 |
| `bun run build` | 并行执行 `vue-tsc --build` + `vite build`（通过 `npm-run-all2`） |
| `bun run type-check` | `vue-tsc --build`（不是 `tsc`） |
| `bun run build-only` | 仅 `vite build`（跳过类型检查） |
| `bun lint` | 依次执行 `oxlint . --fix` 然后 `eslint . --fix --cache` |
| `bun run format` | `oxfmt src/` |
| `bun tauri dev` | 启动 Tauri 开发模式（Rust + Vite） |
| `bun tauri build` | 构建 Tauri 桌面应用 |
| `bun tauri ios init` | 初始化 iOS 项目 |
| `bun tauri android init` | 初始化 Android 项目 |

## 工具链注意事项
- **格式化工具**：`oxfmt`（不是 Prettier）。配置：无分号、单引号（`.oxfmtrc.json`）。
- **代码检查**：两轮检查——先 `oxlint`（基于 Rust），再 `eslint`（`.oxlintrc.json` + flat config）。
- **类型检查**：`vue-tsc` 替代 `tsc`。TypeScript 错误来自 `vue-tsc --build`，而不是 `tsc`。
- **编辑器**：推荐 VSCode——Volar（不是 Vetur），默认 oxc 格式化器，保存时自动格式化 + 自动修复。

## 架构
- **入口**：`index.html` → `src/main.ts` → `App.vue`
- **路径别名**：`@/*` → `./src/*`（在 `vite.config.ts` 和 `tsconfig.json` 中均已配置）
- **CSS**：Tailwind CSS v4，在 `src/t.css` 中通过 `@import 'tailwindcss'` 引入（无 `tailwind.config.js`）。使用 `tw-animate-css` 实现动画。
- **shadcn-vue**：已配置（`components.json`）。组件放在 `src/components/ui/`。工具函数 `cn()` 位于 `@/lib/utils`。
- **状态管理**：Pinia（组合式/Setup Stores 风格——参考 `src/stores/counter.ts`）。
- **路由**：Vue Router 5，`createWebHistory`。
- **类型**：`env.d.ts` 中包含 `.vue` 模块声明。TypeScript 配置分为 `tsconfig.app.json`（应用代码）+ `tsconfig.node.json`（Node 配置），由根目录 `tsconfig.json` 引用。

## 代码风格约定
- 2 空格缩进，LF 换行，100 字符行宽限制（`.editorconfig`）
- 无分号、单引号（由 `oxfmt` 强制执行）
- 所有源代码都在 `src/` 目录下
