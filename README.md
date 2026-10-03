# 一纸简历（yizhi）

无需登录的在线简历编辑器。填写经历、调整版式，即时预览；草稿只保存在当前浏览器，支持 JSON 备份及 A4 / 长页 PDF 导出。

[在线使用](https://yizhi.shqingda.workers.dev)

- 本机多份简历：新建、命名、复制、切换、自动保存。
- 修改保护：一页编辑、其余页面只读同步，撤销重做、删除撤销、导入确认、最近 5 个恢复点。
- 填写与排版：栏目排序和隐藏、经历复制折叠、日期辅助、照片裁剪压缩。
- 阅读与导出：编辑 / 预览切换、缩放、A4 文字 PDF、长页图片 PDF。
- 界面：手机布局、键盘操作、浅色 / 深色 / 跟随系统。

当前版本没有账号、云端同步或公开分享。`/resume` 显示当前浏览器的草稿；JSON 用于跨设备迁移，清除浏览器数据会清除草稿和恢复点。

## 开发

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 [本地编辑器](http://127.0.0.1:45221)。不需要数据库、登录服务或环境密钥。

```bash
pnpm check       # 类型、测试、生产构建、包体积预算
pnpm preview     # 构建并预览生产版本
```

技术栈：React、TypeScript、Vite、Tailwind CSS、Base UI、Motion、Cloudflare Workers。PDF 使用浏览器打印，或按需加载 modern-screenshot 与 jsPDF。

## 文档

| 内容 | 文档 |
| --- | --- |
| 当前生产版本与线上验证 | [2026-10-03 紧凑预览工具栏发布](docs/qa/2026-10-03-toolbar-release.md) |
| 使用、开发、部署、修改样例 | [使用与开发指南](docs/guide.md) |
| 数据流、模块职责、存储与导出边界 | [技术架构](docs/architecture.md) |
| 项目经历、面试介绍与技术追问 | [面试准备](docs/project-experience.md) |
| 当前范围、已完成能力、剩余验收 | [体验与待办](docs/ux-plan.md) |
| 最新执行结果、A4 预览修正与键盘焦点 | [分页与焦点复查](docs/qa/2026-10-03-pagination-focus.md) |
| 编辑互斥、排序与导出回归 | [交互与可靠性验收](docs/qa/2026-10-03-interaction.md) |
| 上一轮保存保护与长文本布局 | [保存与布局验收](docs/qa/2026-10-03-reliability.md) |
| 本次重构、包体积对比与验收证据 | [重构验收](docs/qa/2026-10-02-refactor.md) |
| 各轮验证范围、发布记录与未覆盖项 | [验收记录索引](docs/qa/README.md) |

操作说明维护在指南，原理维护在架构，面试口述维护在面试准备。历史验收记录注明日期，不作为当前待办；旧版云端设计可从 Git 历史查看。

## License

MIT
