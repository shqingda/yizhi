# 2026-10-03 紧凑预览工具栏发布

[验收索引](README.md) · [当前待办](../ux-plan.md) · [上一生产版本](2026-10-03-release.md)

预览页操作合并为单行：左侧返回，中间主题与缩放，右侧 JSON 备份与导出。分组使用留白，无分隔线。桌面恢复原版文字按钮 28px、图标按钮 32px；窄桌面不再套用 44px 触控尺寸，触控设备仍保留 44px 操作区域。

## 版本

- 线上地址：[一纸简历](https://yizhi.shqingda.workers.dev)。
- 应用代码：[`f0d4128f5bac8eb3aea9de0c95ff6ac1bcbc779f`](https://github.com/shqingda/yizhi/commit/f0d4128f5bac8eb3aea9de0c95ff6ac1bcbc779f)，已推送 `main`。
- Cloudflare 版本：`c6423172-d57b-4630-8c21-94cef1ea5932`，发布标签 `f0d4128`，流量 100%。
- 部署时间：2026-10-03 16:57:43（北京时间）。
- 上一生产版本：`da5f7644-5503-499c-ae89-36ee3bedd8ba`。
- 发布命令：`pnpm run deploy --tag f0d4128 --message "f0d4128: compact single-row preview toolbar"`。

本记录为发布后的文档归档，线上应用代码对应上述 `f0d4128`。无数据格式变更或数据库迁移。

## 验证

- 发布前 `pnpm check` 通过：14 个测试文件、125 项测试，以及类型检查、生产构建和体积预算。
- 编辑器累计 596.08 kB / gzip 192.74 kB；公共入口及共享依赖 313.60 kB，预算未改变。
- `git diff --check` 通过；普通推送成功。
- Cloudflare 部署列表确认新版本承接 100% 流量。
- `/`、`/editor`、`/resume` 以及 10 个 JavaScript / CSS 文件，共 13 项响应的 SHA-256 与本地产物一致。
- `/api/health` 返回 `{"ok":true,"service":"yizhi","storage":"browser"}`。
- 线上 1280px 与 835px 桌面视口实测：文字按钮高 28px、图标按钮高 32px，所有按钮垂直中心一致；835px 下工具栏无溢出。
- 线上主题菜单正常打开和关闭，浏览器控制台无警告或错误。

![线上紧凑工具栏](images/2026-10-03-compact-toolbar-release.png)

线上验证页因另一页面持有编辑权而显示“在此编辑”。本次未修改简历内容、接管编辑权或重复执行 PDF 与真机触控验收。
