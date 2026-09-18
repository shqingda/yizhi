# 一纸简历：技术架构与代码脉络

[文档首页](../README.md) · [使用与开发](guide.md) · [面试准备](project-experience.md)

**本页目录**

- [1. 项目是什么](#chapter-1)
- [2. 整体结构：代码在哪里运行](#chapter-2)
- [3. 目录与模块：每层管什么](#chapter-3)
- [4. 数据模型：内容、版式和保存状态要分清](#chapter-4)
- [5. 一次编辑如何走过系统](#chapter-5)
- [6. 云端接口与冲突处理](#chapter-6)
- [7. 公开页从哪里拿数据](#chapter-7)
- [8. 排版：把简历数据变成纸张内容](#chapter-8)
- [9. 导出：同一内容，两条输出路径](#chapter-9)
- [10. 模板、构建与部署](#chapter-10)
- [11. 当前限制与后续方向](#chapter-11)
- [12. 测试与阅读顺序](#chapter-12)

本文依据 2026-09-14 的仓库实现整理。先解释系统如何运转，再定位到代码；“后续改进”与已实现功能分开说明。面试口述和名词详解见 [项目经历与面试准备](project-experience.md)。

<a id="chapter-1"></a>

## 1. 项目是什么

一纸简历是独立开发的在线简历工具。用户填写经历、调整顺序和版式，浏览器即时生成预览；内容可以保存到本机和云端，也可以通过链接展示或导出 PDF。

理解架构先记住三件事：

1. **一份数据驱动界面。** 表单修改当前简历数据，预览根据这份数据更新。
2. **一套组件负责排版。** 编辑预览和公开页共用 `ResumeDocument`，导出也从它生成的页面内容开始。
3. **显示与保存分开。** 预览立即更新；本地和云端保存稍后执行，网络速度不决定输入反馈速度。

当前没有多人协作编辑、完整账号权限体系或服务端 PDF 生成。它是同一仓库中的前端应用加后端接口，不是多个独立微服务。

<a id="chapter-2"></a>

## 2. 整体结构：代码在哪里运行

```mermaid
flowchart TB
    subgraph Browser[用户浏览器]
        Editor[EditorPage 编辑页]
        Forms[表单与排序组件]
        State[useResume 当前简历与保存状态]
        Public[PublicResumePage 公开页]
        Document[ResumeDocument 简历排版]
        Fit[useResumeFit 测量与分页]
        Export[exportResume PDF 导出]
        Local[(localStorage 本地草稿)]
        Client[api.ts 请求封装]
        Editor --> Forms
        Forms -->|修改数据| State
        State -->|当前简历| Document
        State -->|保存草稿| Local
        Local -->|初始化恢复| State
        State --> Client
        Public --> Client
        Public --> Document
        Document --> Fit
        Document -->|页面内容| Export
    end
    subgraph CF[Cloudflare]
        Assets[静态资源 HTML / JS / CSS]
        Worker[Workers 运行 Hono API]
        ORM[Drizzle 数据库访问]
        DB[(D1 简历记录)]
        Worker --> ORM
        ORM --> DB
    end
    Assets -->|加载前端应用| Editor
    Assets -->|加载前端应用| Public
    Client -->|HTTP 读取与保存| Worker
```

前端在浏览器运行，负责交互、排版和导出。后端在 Cloudflare Workers 运行，负责接收请求、读写数据库和比较版本。D1 负责长期存储数据。

**HTTP** 是浏览器和后端交换请求、响应的协议；**API** 是双方约定的请求入口；**静态资源**是打包后的页面、脚本和样式文件。

### 技术职责

| 技术 | 在项目中的职责 |
| --- | --- |
| React + TypeScript | 实现组件和状态更新，约定简历与接口数据的类型。 |
| React Router | 根据地址选择编辑页或公开页。 |
| Tailwind CSS / 专用 CSS | 前者主要用于编辑器控件，后者控制简历纸张、字体、布局和打印。 |
| Base UI / 仓库中的 UI 组件 | 提供按钮、菜单等基础交互；Lucide 提供图标。 |
| Vite | 启动本地开发服务，构建前端与 Worker。 |
| Hono | 定义后端路由，解析请求并返回响应。 |
| Drizzle ORM | 描述表结构并执行数据库读写；它是访问数据库的工具，不是数据库本身。 |
| Cloudflare Workers + D1 | 前者运行后端，后者存放简历。 |
| modern-screenshot + jsPDF | 将简历转成图片，再生成长图 PDF。A4 模式另走浏览器打印。 |
| Vitest | 验证数据处理、分页计算和保存等逻辑。 |

当前状态管理使用 React 和自定义 Hook，没有使用 Zustand；数据整理使用手写函数，没有接入 Zod。Hook 是把状态和相关行为组织在一起的 React 函数。

<a id="chapter-3"></a>

## 3. 目录与模块：每层管什么

```text
yizhi/
├── src/app/                         浏览器端
│   ├── main.tsx                     挂载 React 应用
│   ├── App.tsx                      页面地址与路由
│   ├── pages/                       编辑页、公开页的组合与流程
│   ├── components/editor/           表单、排序、列表操作
│   ├── components/resume/           简历正文展示
│   ├── components/ui/               基础控件
│   ├── hooks/useResume.ts           当前简历、初始化、本地与云端保存
│   ├── hooks/useResumeFit.ts        页面测量、分页占位、间距调整
│   ├── lib/api.ts                   浏览器请求后端的统一入口
│   ├── lib/storage.ts               本地存储和 JSON 文件操作
│   ├── lib/exportResume.ts          两种 PDF 导出路径
│   └── index.css                    页面、简历及打印样式
├── src/shared/                      共享的数据定义和基础逻辑
│   ├── schema.ts                    Resume 类型与数据规范化
│   ├── seed.ts                      从 JSON 模板构造默认数据
│   ├── paginate.ts                  只用高度数字计算分页
│   └── sync.ts                      比较保存版本是否过期
├── src/worker/index.ts              Hono 接口、版本检查和数据库操作
├── src/db/schema.ts                 Drizzle 数据表定义
├── src/test/                        自动化测试
├── public/sample-resume.json        唯一的内置简历模板
├── drizzle/                         数据库建表及迁移 SQL
├── vite.config.ts                   构建插件与路径别名
└── wrangler.toml                    Cloudflare 资源与运行配置
```

**依赖方向：** 页面组合组件和 Hook；Hook 调用 API、本地存储等工具；前后端共用数据定义；Worker 通过 Drizzle 访问 D1。`shared` 中的分页和版本判断不依赖页面，方便单独测试。

当前后端路由、数据库操作和流程判断集中在一个 Worker 文件中，没有另外拆出 service、repository 等层。当前规模下阅读路径较短；以后变复杂时再按实际职责拆分。

<a id="chapter-4"></a>

## 4. 数据模型：内容、版式和保存状态要分清

### 4.1 简历本身：Resume

[数据定义](../src/shared/schema.ts) 将简历分成内容和配置：

| 部分 | 字段举例 | 含义 |
| --- | --- | --- |
| 基本信息 | `basics.name`、`phone`、`email`、`photo` | 姓名、联系方式、照片等。 |
| 经历列表 | `education`、`experience`、`projects` | 每项有稳定 ID，保存对应内容。 |
| 其他栏目 | `skills`、`awards`、`publications`、`languages`、`customSections` | 技能、获奖等，以及用户自定义内容。 |
| 显示配置 | `meta.sectionOrder`、`hiddenSections`、`basicsOrder`、`hiddenBasics` | 栏目和联系字段的顺序、显隐。 |
| 版式配置 | `meta.layoutMode`、`headerAlign`、`fontScale`、`showPhoto` | 长图或 A4、基本信息位置、字号、照片显示。 |

隐藏字段只改显示配置，不删除原值。照片以包含图片内容的 Data URL 文本保存在 `basics.photo`，所以可以随 JSON 导入导出，代价是数据文件和请求体变大。

`layoutMode` 的取值容易混淆：`single` 表示连续长图模式，`multi` 表示 A4 分页模式；它们不直接表示内容最终一定是一页或多页。

### 4.2 数据进来时：normalizeResume

JSON 文件、浏览器草稿和数据库内容都可能缺少字段或沿用旧结构。`normalizeResume` 会整理字段类型、补默认配置和标识，并处理旧数据兼容。

TypeScript 只能帮助检查程序代码，无法证明外部文件一定正确，因此读取后仍需要这种运行时处理。目前采用的是较宽松的规范化，不是所有不合法输入都严格拒绝。用户主动留空的日期会保留，不能和“根本没提供日期”混为一谈。

### 4.3 编辑过程中：保存状态不属于简历正文

[useResume](../src/app/hooks/useResume.ts) 除了 `resume`，还管理：

| 状态 | 作用 |
| --- | --- |
| `slug` | 分享地址中的简历标识。 |
| `hydrated` | 初始化读取流程是否结束，用于控制何时开始自动保存。 |
| `dbAvailable` | 初始健康检查得到的数据库可用状态。 |
| `cloudUpdatedAt` | 当前记住的云端更新时间，保存时作为版本条件。 |
| `cloudConflict` | 是否已检测到保存冲突；为真时暂停自动云端保存。 |
| `saving` | 控制“保存中”提示和手动保存按钮。 |

编辑页还自己管理当前选中的表单、侧栏开关、预览缩放和导出状态。这些是界面状态，无需写进简历 JSON。

### 4.4 数据库如何保存

[resumes 表](../src/db/schema.ts) 一份简历对应一行：

| 字段 | 约束与用途 |
| --- | --- |
| `id` | 主键，内部唯一标识。 |
| `slug` | 非空、唯一，用于分享地址。 |
| `data` | 非空文本，保存整份简历的 JSON。 |
| `updated_at` | 非空文本，保存更新时间并参与版本比较。 |

整份 JSON 适合当前整份读写的操作方式，也方便扩展栏目。后续如果需要跨简历按公司、技能做大量筛选统计，需要重新考虑字段拆分和查询设计。

<a id="chapter-5"></a>

## 5. 一次编辑如何走过系统

### 5.1 打开编辑器

[App.tsx](../src/app/App.tsx) 定义 `/` 和 `/editor` 进入编辑器，`/resume` 进入默认公开页，`/r/:slug` 进入指定公开页。

编辑器初始化按以下顺序执行：

1. `useResume` 从 localStorage 读草稿；缺失或无法解析时使用内置模板。
2. 调用健康接口检查 D1 是否可用。
3. 可用时读取对应云端简历。浏览器没有草稿才用云端内容替换当前数据；已有草稿则保留本地内容，但仍记录云端更新时间。
4. 标记初始化完成，启用后续保存流程。

本地有无草稿的判断目前检查存储键是否存在，并不是严格判断它是否有效。损坏草稿可能先回退模板，再因键仍存在而阻止云端内容替换。这属于当前初始化逻辑的边界。

### 5.2 修改手机号、排序或隐藏内容

表单更新 `resume.basics.phone`；拖动更新顺序数组；显隐更新隐藏字段列表。React 收到新状态后，重新生成预览。

[SortableList](../src/app/components/editor/SortableList.tsx) 用指针按下、移动和松开事件处理排序。移动时选择离指针最近的行中心，生成新数组；稳定 ID 用于跟踪条目，Ref 用于读取拖动过程中的最新列表。停止拖动后清理事件监听。

编辑页的预览缩放只用于适应屏幕。简历本身仍按纸张宽度排版，缩放比例不当作用户字号保存。

### 5.3 本地与云端保存

```mermaid
sequenceDiagram
    participant U as 用户
    participant S as React / useResume
    participant L as 浏览器本地存储
    participant A as Hono API
    participant D as D1
    U->>S: 修改表单
    S->>S: 更新简历并立即刷新预览
    Note over S,L: 初始化完成后，变化约 350ms 后写本地
    S->>L: 保存简历 JSON
    Note over S,A: 数据库可用且无冲突，约 1600ms 后安排云端保存
    S->>A: PUT 简历 + 基础版本
    A->>D: 查询现有内容与版本
    D-->>A: 当前记录
    alt 检测到版本过期
        A-->>S: 409 冲突 + 当前云端数据
        S->>S: 保留编辑内容，暂停自动云端保存
    else 未检测到冲突
        A->>D: 插入或更新整份简历
        A-->>S: 保存结果 + 新更新时间
        S->>S: 记录新版本，解除冲突状态
    end
```

这里的等待是**防抖**：连续输入会取消旧定时器，等短暂停顿再执行。两条保存流程独立安排，图中不表示云端一定等本地写入成功后才开始。

本地存储键包括 `yizhi:draft`、`yizhi:slug` 和侧栏偏好的 `yizhi:sidebar`。首次读取新键时，若不存在则从对应的旧 `resume-studio:*` 键复制数据，并保留旧值；已有新值不会被覆盖。此迁移仅适用于相同网站来源，换域名需先导出 JSON 再导入。草稿目前只有一个固定键，没有按不同简历标识分别保存。

<a id="chapter-6"></a>

## 6. 云端接口与冲突处理

### 6.1 接口职责

[api.ts](../src/app/lib/api.ts) 统一处理浏览器请求；[worker/index.ts](../src/worker/index.ts) 接收并处理请求。

| 接口 | 行为 |
| --- | --- |
| `GET /api/health` | 返回服务状态和 D1 是否可用。 |
| `GET /api/resumes` | 返回记录的 ID、slug 和更新时间列表。 |
| `GET /api/resumes/:idOrSlug` | 按内部标识或分享标识读取。 |
| `PUT /api/resumes/:idOrSlug` | 规范化输入，比较版本，创建或更新整份简历。 |

`GET` 用来读取，`PUT` 用来保存。保存成功返回记录及更新时间，新建返回 201；版本冲突返回 409。数据库不可用时，默认简历读取可返回示例，其他读取或保存可能返回 503。

`openDb` 通过 `env.DB` 取得绑定，并执行“表和唯一索引不存在才创建”的语句，再返回 Drizzle 访问对象。仓库另有迁移 SQL；当前并不是只在部署时才尝试建表。

### 6.2 版本检查解决什么问题

两个页面都读到旧简历，A 先保存，B 随后提交整份旧内容，可能覆盖 A 的修改。B 因此需要带上“自己从哪个版本开始编辑”的信息。

当前版本就是更新时间。客户端把它放进请求体 `baseUpdatedAt` 和请求头 `If-Match`；服务端优先取请求体字符串，否则取请求头，交给 [sync.ts](../src/shared/sync.ts) 比较。

`If-Match` 可以理解为“版本匹配时再修改”的条件。本项目使用自己的时间戳约定和 409 响应，没有实现完整 ETag 条件请求；ETag 是服务端标记资源版本的一种机制。

冲突后，前端不会用响应里的云端内容覆盖当前状态。本地草稿仍按自己的流程保存，自动云端保存暂停。菜单中的覆盖保存通过省略版本条件主动提交本地稿；当前没有自动合并或历史版本恢复。

### 6.3 失败结果如何传到界面

API 客户端把保存结果整理成 `saved`、`conflict`、`error`，Hook 再转为页面使用的 `ok`、`conflict`、`local`。其中 `local` 表示未成功写入云端，不是对 localStorage 写入成功的独立确认。

普通读取失败在客户端会转成 `null`，公开页再决定回退或显示未找到。当前没有把所有网络错误、404 和后端故障都精细区分给页面。

<a id="chapter-7"></a>

## 7. 公开页从哪里拿数据

[PublicResumePage](../src/app/pages/PublicResumePage.tsx) 不使用编辑器的 `useResume`，而是自行读取分享地址对应的数据：

1. 请求对应云端简历，成功则显示返回内容。
2. API 对默认简历可能直接返回示例，并附带回退标记。
3. 请求没有取得数据时，默认地址尝试本机草稿；存储工具自身也会回退模板。
4. 其他标识没有取得内容时显示未找到。

取得数据后，同样交给 `ResumeDocument` 排版。没有定时轮询或 WebSocket 推送，因此一个已打开的公开页不会逐字跟随编辑器变化。

本机草稿只属于当前浏览器，不能当作别人一定能看到的分享内容。并且当前回退路径可能把存储工具返回的模板标记为“本机草稿”，显示来源标签不等于严格的数据来源追踪。

<a id="chapter-8"></a>

## 8. 排版：把简历数据变成纸张内容

[ResumeDocument](../src/app/components/resume/ResumeDocument.tsx) 负责按配置生成栏目、标题、条目、图标和照片。它调用 `useResumeFit`，把测量后的页数和高度回传页面，供预览容器占位。

```mermaid
flowchart LR
    Data[Resume 内容与版式] --> Doc[ResumeDocument 生成页面元素]
    Doc --> Measure[useResumeFit 测量内容块]
    Measure --> Calc[paginateBlocks 计算换页点]
    Calc --> Space[插入分页空白]
    Space --> Preview[A4 预览]
    Calc --> Info[回传页数和高度]
```

**DOM** 是浏览器中的页面元素结构。分页分两层：

- `useResumeFit` 依赖浏览器：读取元素实际高度及间距，清理旧占位，应用新占位。
- [paginate.ts](../src/shared/paginate.ts) 只接收块标识、高度和类型，按顺序决定换页，便于用数字独立测试。

A4 按 210 × 297mm 的比例计算，正文高度扣除上下边距。普通条目是一个内容块；标题标为需要与下一块一起考虑。若当前页放得下标题却放不下第一条内容，就在标题之前换页。

预览用空白占满本页剩余空间，把后续内容推到下一页；打印时把占位转成明确分页规则。重新测量前先去掉旧空白，避免重复计入高度。

末页偏空时会尝试适度增加间距，前提是不增加页数。内容、版式、纸张宽度和字体加载变化会触发相关重算。长图模式则清理分页空白，按内容自然延伸。

<a id="chapter-9"></a>

## 9. 导出：同一内容，两条输出路径

[exportResume.ts](../src/app/lib/exportResume.ts) 在浏览器完成全部导出，不请求后端生成文件。

| | A4 模式 | 长图模式 |
| --- | --- | --- |
| 输入 | 当前简历页面元素 | 当前简历页面元素 |
| 处理 | 克隆到不可见 iframe，复制样式，设置打印规则 | 克隆到屏幕外，去缩放后转成 2 倍比例 PNG |
| 输出方式 | 浏览器打印对话框，由用户另存为 PDF | jsPDF 把 PNG 放入自定义高度 PDF 并下载 |
| 文本性质 | 通常保留可选择、可复制的文字 | 没有独立文字层，文字成为图片像素 |
| 尺寸 | A4，可多页 | 210mm 宽，高度随图片比例增长 |

iframe 是页面内的独立网页容器，用来隔离打印内容。两条路径都会等待字体和图片，并清理预览缩放、阴影等展示效果。

共用页面结构减少了重复维护，但不保证所有浏览器下预览与打印完全一致。超长条目、字体和打印设置仍可能产生差异。

<a id="chapter-10"></a>

## 10. 模板、构建与部署

### 10.1 模板是一处来源，不是用户数据的覆盖规则

[seed.ts](../src/shared/seed.ts) 通过 Vite 的 `?raw` 导入 [sample-resume.json](../public/sample-resume.json)，将文件文本解析、规范化成 `SAMPLE_RESUME`。

编辑器重置、默认回退和默认记录初始化使用这个对象，避免维护两套示例。模板会进入前后端构建产物，照片等大字段也会增加包体积。

发布新模板不会自动替换已有 D1 记录或浏览器草稿。

### 10.2 请求怎么到达前后端

[wrangler.toml](../wrangler.toml) 配置：

- `main` 指向 Worker 入口。
- `assets.directory` 指向构建后的前端目录 `dist/client`。
- `/api/*` 优先由 Worker 处理。
- 其他地址通过静态资源及单页应用回退进入前端，由 React Router 选择页面。
- `DB` 绑定连接 D1；数据库结构迁移目录为 `drizzle`。

**单页应用回退**是让 `/r/某个标识` 这样的前端地址也能取得入口页面，而不是被当作缺失文件。简历内容随后通过 API 读取，不是后端预先生成的 HTML。

Vite 的 React、Tailwind 和 Cloudflare 插件共同参与开发、构建。`@` 指向 `src/app`，`@shared` 指向 `src/shared`，只是简化代码导入路径的别名。

### 10.3 开发与发布入口

安装、开发、检查、迁移和发布命令统一维护在 [使用与开发指南](guide.md#development)。本节解释构建和部署关系，具体操作按指南执行。

<a id="chapter-11"></a>

## 11. 当前限制与后续方向

这些是现有代码的边界，用来判断下一步该改哪里，并不是已经实现的能力。

| 当前情况 | 影响 | 后续方向 |
| --- | --- | --- |
| 没有账号认证和所有者授权 | 公开页的只读界面不等于写入 API 受保护 | 为写入增加身份与归属校验。 |
| 版本先查再更新，未在更新条件中检查版本 | 两个请求同时通过检查后仍可能互相覆盖 | 在数据库更新语句中加入旧版本条件，并检查更新行数。 |
| 草稿未记录它对应的云端基础版本 | 恢复旧本地内容并读取新时间戳，不代表已经合并 | 将草稿与基础版本一起存储。 |
| 本地只有一个草稿键，修改 slug 不重新执行初始化 | 不能视为完整的多简历切换和管理机制 | 按简历标识隔离草稿，明确切换与版本重置流程。 |
| 保存成功改变版本及回调，可能再次触发自动保存 | 无新输入时也可能重复请求 | 比较内容是否变更，梳理保存依赖和请求串行化。 |
| 本地写入没有完整错误处理，保存依赖定时器 | 配额不足或关闭页面过早可能丢失末次修改 | 提供失败状态与更完善的保存策略。 |
| 没有网页离线缓存或持久重试队列 | 本地草稿不等于完整离线应用 | 根据实际离线需求补缓存和重试机制。 |
| 整条经历作为分页块，照片加载未单独驱动分页重算 | 超高条目和异步图片可能影响结果 | 细分超长内容，完善加载后的重测与打印验证。 |
| 照片内嵌 JSON | 增加模板、存储和网络体积 | 增加图片大小控制，按需要引入文件存储。 |

其中“原子更新”指版本条件判断与写入由数据库作为一个操作完成，避免两个独立步骤之间被其他请求插入。

<a id="chapter-12"></a>

## 12. 测试与阅读顺序

测试集中在 [src/test](../src/test)，由 [vitest.config.ts](../vitest.config.ts) 配置的 jsdom 环境执行。jsdom 模拟部分浏览器接口，适合逻辑与组件测试，但不能替代真实浏览器的排版和打印。

数据规范化、分页数字计算、版本比较、本地存储、API 客户端和保存 Hook 都有对应测试。Worker 测试主要覆盖无 D1 的接口行为，不等于真实数据库并发测试；导出测试也不等于 PDF 内容和视觉质量验证。

想沿代码理解整个项目，建议按以下路线读：

1. [schema.ts](../src/shared/schema.ts)：知道一份简历有哪些内容和配置。
2. [App.tsx](../src/app/App.tsx) → [EditorPage.tsx](../src/app/pages/EditorPage.tsx)：知道用户从哪里进入、界面怎么组合。
3. [useResume.ts](../src/app/hooks/useResume.ts)：知道数据从哪里来、什么时候保存。
4. [ResumeDocument.tsx](../src/app/components/resume/ResumeDocument.tsx) → [useResumeFit.ts](../src/app/hooks/useResumeFit.ts) → [paginate.ts](../src/shared/paginate.ts)：知道数据如何排成纸张。
5. [exportResume.ts](../src/app/lib/exportResume.ts)：知道纸张如何变成导出文件。
6. [api.ts](../src/app/lib/api.ts) → [worker/index.ts](../src/worker/index.ts) → [db/schema.ts](../src/db/schema.ts)：知道云端保存经过哪些步骤。
7. [PublicResumePage.tsx](../src/app/pages/PublicResumePage.tsx) → [wrangler.toml](../wrangler.toml)：知道别人如何打开并读取简历。

改功能时也可以反过来定位：字段问题先看 schema 和表单，显示问题看 ResumeDocument 与 CSS，分页问题看测量 Hook 和分页函数，保存问题沿 Hook → API → Worker → D1 排查。
