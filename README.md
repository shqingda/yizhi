# 一纸简历

在线简历生成器：左侧表单 + 右侧实时预览，公开分享页，打印 / PDF 导出。默认模板为经典中文技术简历，支持左、中、右三种基本信息布局和带图标的联系信息。

A Magic Resume–style editor with a shareable public page. Preview, print, and PDF share one A4 layout.

项目经历文案与逐项实现说明见 [项目经历详解](docs/project-experience.md)。

## Stack

- **pnpm** · **Vite 8** · **React 19** · **TypeScript 7**
- **Tailwind CSS v4** · **shadcn/ui**
- **Hono** API on **Cloudflare Workers**
- **Drizzle ORM** + **Cloudflare D1**
- **Wrangler** for local D1, preview, and deploy

## Scripts

```bash
pnpm install
pnpm dev              # http://127.0.0.1:45221  (Vite + Workers runtime + local D1)
pnpm build
pnpm preview
pnpm deploy           # wrangler deploy (after build)
pnpm db:generate      # drizzle-kit generate
pnpm db:migrate       # apply SQL to local D1
pnpm db:migrate:prod  # apply SQL to remote D1
pnpm cf-typegen       # regenerate Worker types
```

`pnpm dev` 即可使用编辑器。D1 未绑定时编辑器仍可用：**localStorage 自动保存** + 内置示例 JSON。

## 使用 / Usage

| 路由 | 说明 |
| --- | --- |
| `/` 或 `/editor` | 编辑器：栏目表单、+自定义区块、底部单独的版式设置 |
| `/resume` | 公开页（默认 slug `shqingda`） |
| `/r/:slug` | 指定 slug 的只读简历 |

- **实时预览** 即打印版式（A4，页边距 16mm，Noto Sans SC）
- **A4 分页引擎**：按标题/条目测高后贪心装箱，标题与首条绑定；预览垫片对齐页缝，打印映射为 `page-break`
- **导出 PDF**：长图走 DOM 光栅化；A4 走隔离 iframe 打印。`@page` 已设为 A4
- **云端写入** 带 `If-Match` 版本戳，冲突返回 409 并保留本地稿
- **JSON 导入 / 导出**、**重置为示例**
- **版式**：长图 / A4、字号、可选照片、栏目顺序
- 公开页优先读 D1；失败时回退本机草稿或示例数据

## API

| Method | Path | |
| --- | --- | --- |
| `GET` | `/api/health` | `{ ok, db }` |
| `GET` | `/api/resumes` | 列表 |
| `GET` | `/api/resumes/:idOrSlug` | 读取；`shqingda` / `default` 首次访问会写入示例 |
| `PUT` | `/api/resumes/:idOrSlug` | 保存 JSON |

表 `resumes`：`id`, `slug`, `data` (JSON text), `updated_at`。

## D1 / Wrangler

1. 本地：`wrangler.toml` 已声明 `DB` binding。`pnpm dev` 通过 `@cloudflare/vite-plugin` 使用本地 D1。首次 API 调用会 `CREATE TABLE IF NOT EXISTS`。也可运行 `pnpm db:migrate`。
2. 生产：

```bash
pnpm wrangler d1 create resume-studio
# 把返回的 database_id 写入 wrangler.toml
pnpm db:migrate:prod
pnpm deploy
```

将 `wrangler.toml` 中的占位 `database_id` 换成真实 ID 后再部署。

## 自定义简历 / Customize

1. 打开编辑器改各区块，或导入 `public/sample-resume.json` 为起点。
2. 类型定义见 `src/shared/schema.ts`：`basics`, `skills[]`, `experience[]`, `projects[]`, `education[]`, `awards?`, `publications?`, `languages?`, `customSections?`, `meta?`。
3. 示例数据统一维护在 `public/sample-resume.json`，`src/shared/seed.ts` 直接读取该文件，供编辑器重置、公开页回退和首次 D1 写入使用。
4. 版式：`src/app/components/resume/ResumeDocument.tsx` 与 `src/app/index.css`。

## 项目结构

```
src/worker/index.ts          Hono API
src/db/schema.ts             Drizzle D1
src/shared/schema.ts         简历类型与规范化
src/shared/seed.ts           商庆达示例
src/app/pages/               编辑器 / 公开页
drizzle/                     SQL migrations
wrangler.toml
drizzle.config.ts
```

## License

MIT
