# 一纸简历

独立开发的在线简历工具：填写和调整内容，即时预览排版，保存本地草稿或云端记录，通过链接分享，并导出 A4 或长图 PDF。

## 文档入口

所有详细文档集中在 `docs/`，从下面选择需要的内容。

| 你想做什么 | 阅读文档 | 内容范围 |
| --- | --- | --- |
| 使用工具、启动项目、部署或修改模板 | [使用与开发指南](docs/guide.md) | 操作步骤、常用命令、Cloudflare 配置和常见问题。 |
| 理解项目怎么运转、到代码里找实现 | [技术架构](docs/architecture.md) | 整体结构、数据流、模块职责、分页导出、保存冲突与当前限制。 |
| 准备面试、解释项目和技术名词 | [面试准备](docs/project-experience.md) | 简历文案、开场介绍、逐项详解、追问回答和练习顺序。 |

**准备面试：** 先练 [开场介绍](docs/project-experience.md#chapter-2)，再看 [整体架构](docs/architecture.md#chapter-2)，最后按问题阅读面试详解。

**接手开发：** 先按指南启动项目，再顺着架构文档末尾的 [源码阅读顺序](docs/architecture.md#chapter-12) 阅读。

## 快速启动

```bash
pnpm install
pnpm dev
```

打开 [本地编辑器](http://127.0.0.1:45221)。项目通过 Vite 和 Cloudflare 插件运行前端与本地 Worker；数据库不可用时，可使用本地草稿和内置示例。

技术栈：React、TypeScript、Vite、Tailwind CSS、Base UI、Hono、Drizzle ORM、Cloudflare Workers、D1。各技术负责什么，见 [技术架构](docs/architecture.md#chapter-2)。

## 文档维护约定

- 使用步骤和命令更新到使用与开发指南。
- 模块关系、数据流程和实现边界更新到技术架构。
- 面试口述、例子和名词解释更新到面试准备。
- 新增独立主题时先在此处加入口；不再在根目录零散添加说明文件。

## License

MIT
