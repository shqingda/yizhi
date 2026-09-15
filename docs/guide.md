# 使用与开发指南

[文档首页](../README.md) · [技术架构](architecture.md) · [面试准备](project-experience.md)

这份文档说明怎么使用、运行和发布项目。实现原理集中在技术架构中，面试口述和术语解释集中在面试准备中。

**本页目录**

- [使用简历编辑器](#usage)
- [本地开发与验证](#development)
- [Cloudflare 部署](#deployment)
- [修改模板与定位代码](#customization)
- [常见问题](#faq)

<a id="usage"></a>

## 1. 使用简历编辑器

| 地址 | 用途 |
| --- | --- |
| `/` 或 `/editor` | 编辑基本信息、经历、技能等内容，调整版式。 |
| `/resume` | 查看默认简历，默认标识为 `shqingda`。 |
| `/r/:slug` | 查看指定简历；`slug` 是公开链接里的标识。 |

推荐的操作顺序：

1. 填写基本信息、教育、工作和项目经历，也可以从“更多”菜单导入简历 JSON。
2. 拖动栏目和联系信息调整顺序，隐藏暂不展示的内容；需要额外内容时添加自定义区块。
3. 在版式里调整字号、照片和左中右基本信息布局，在工具栏选择长图或 A4。
4. 检查预览，等待保存或从“更多”菜单手动保存到云端。
5. 导出文件，或通过网页预览检查公开链接中的内容。

### 保存与分享

编辑时会安排本地草稿保存；数据库可用时还会安排云端保存。公开页主要读取云端已保存的内容，不会逐字跟随编辑器变化。

检测到云端版本冲突时，当前编辑内容会保留，自动云端保存暂停。确认要以当前稿件替换云端时，再使用菜单里的“覆盖保存到云端”。

默认公开地址读取失败时有本机草稿或示例回退；其他标识没有取得内容时显示未找到。当前没有完整的账号和写入权限体系，公开页的阅读界面不代表保存接口已受权限保护。

### 两种导出

| 模式 | 操作结果 | 用途 |
| --- | --- | --- |
| A4 | 打开浏览器打印对话框，可另存为 PDF；通常保留可复制文字 | 打印、投递。 |
| 长图 | 把整份简历转成图片，再下载包含该图片的长图 PDF | 连续浏览、展示整体排版。 |

A4 会尽量让标题与第一条内容一起换页。导出前仍应检查实际效果，特别是很长的经历、照片及不同字体造成的分页变化。

JSON 导出保存的是内容和配置，方便继续编辑；PDF 用于阅读，两者用途不同。

<a id="development"></a>

## 2. 本地开发与验证

在项目根目录执行：

```bash
pnpm install
pnpm dev
```

访问 [本地编辑器](http://127.0.0.1:45221)。端口固定为 45221；如果被占用，先检查是否已经运行了本项目的开发服务。

Vite 的 Cloudflare 插件提供本地 Worker 和 D1 开发环境。本地数据库与远端数据库分开，操作本地数据不会自动同步到远端。

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动本地开发服务。 |
| `pnpm run build` | 类型检查并构建发布文件。 |
| `pnpm preview` | 构建后预览。 |
| `pnpm test` | 执行 Vitest 测试。 |
| `pnpm check` | 类型检查、测试和生产构建。 |
| `pnpm db:generate` | 根据 Drizzle 表定义生成迁移文件。 |
| `pnpm db:migrate` | 将迁移应用到本地 D1。 |
| `pnpm cf-typegen` | 根据 Cloudflare 配置重新生成 Worker 环境类型。 |

测试能验证分页计算、数据整理和保存逻辑，但不能代替浏览器中的实际排版与打印检查。详细覆盖范围见 [架构：测试与阅读顺序](architecture.md#chapter-12)。

<a id="deployment"></a>

## 3. Cloudflare 部署

当前仓库的 [wrangler.toml](../wrangler.toml) 已配置 Worker 名称、前端资源目录和真实 D1 数据库 ID。向现有项目发布时，确认账号和配置后直接使用：

```bash
pnpm check
pnpm run deploy
```

`pnpm run deploy` 会再次构建，再调用 Wrangler 发布。不要写成 `pnpm deploy`，后者可能调用 pnpm 自带的同名命令。

只有修改了数据库结构并需要应用迁移时，才另外执行：

```bash
pnpm db:migrate:prod
```

这条命令修改的是远端数据库结构，和本地迁移不是同一个目标。

### 部署到一个新的 Cloudflare 项目

1. 用 `pnpm exec wrangler login` 登录目标账号。
2. 用 `pnpm exec wrangler d1 create resume-studio` 创建目标数据库，或选择已有数据库。
3. 将返回的数据库 ID 写入 `wrangler.toml` 的 D1 配置，保持绑定名 `DB` 与代码一致；按需要修改 Worker 名称。
4. 使用 `pnpm db:migrate:prod` 应用数据库迁移。
5. 使用 `pnpm run deploy` 发布。

前端文件由静态资源配置提供，`/api/*` 由 Worker 处理，Worker 通过 `DB` 访问 D1。发布新代码或模板不会主动覆盖已有简历记录。

发布后检查编辑页、公开页和 `/api/health`。健康接口中的 `db: true` 表示该次检查可以打开数据库，不代表已经验证所有保存和并发场景。

<a id="customization"></a>

## 4. 修改模板与定位代码

### 修改自己的简历

在编辑器修改，或导入自己的 JSON。导出 JSON 可以保留内容、版式和内嵌照片，便于以后恢复。

### 修改项目默认模板

统一编辑 [public/sample-resume.json](../public/sample-resume.json)。[seed.ts](../src/shared/seed.ts) 从这里读取示例，供重置和默认回退、默认记录初始化使用。

模板更新后，已有本地草稿和云端记录仍保留原内容。要载入新模板，可使用编辑器“重置示例”；操作前按需要导出当前草稿。

### 按修改内容找文件

| 要修改什么 | 从哪里开始 |
| --- | --- |
| 增加字段、兼容旧 JSON | [schema.ts](../src/shared/schema.ts)、[EditorForms.tsx](../src/app/components/editor/EditorForms.tsx) |
| 简历显示、联系方式与版式 | [ResumeDocument.tsx](../src/app/components/resume/ResumeDocument.tsx)、[index.css](../src/app/index.css) |
| 本地草稿、云端保存 | [useResume.ts](../src/app/hooks/useResume.ts)、[api.ts](../src/app/lib/api.ts) |
| 后端接口和数据库结构 | [worker/index.ts](../src/worker/index.ts)、[db/schema.ts](../src/db/schema.ts) |
| 分页或 PDF 导出 | [架构：排版](architecture.md#chapter-8)、[架构：导出](architecture.md#chapter-9) |

接口清单、表结构和数据流统一见 [技术架构](architecture.md)，这里不另维护一份。

<a id="faq"></a>

## 5. 常见问题

**模板改了，为什么页面没变？** 页面可能在使用已有本地草稿或云端记录。更新模板不是覆盖用户数据；要使用新示例，需要在编辑器重置或导入。

**编辑器已经改了，别人打开链接为什么还是旧内容？** 预览立即更新，公开链接读取已保存内容。先确认云端保存成功，再重新加载公开页。

**显示“仅保存在此浏览器”怎么办？** 检查接口和 D1 是否可用。该提示表示没有成功连接或写入云端，并非对本地写入一定成功的独立确认。重要内容可另行导出 JSON。

**长图 PDF 为什么不能复制文字？** 当前长图路径先把简历变成图片，再放入 PDF。需要保留文字时使用 A4 打印路径。

**隐藏联系方式，是否等于把数据删掉？** 不等于。隐藏只影响展示，原值仍可能保存在 JSON 和数据库里。

**完整的技术解释看哪里？** 系统如何配合看技术架构；“面试怎么说”和名词解释看面试准备。两份文档顶部都有章节目录。
