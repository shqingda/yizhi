import { ThemeMenu } from "@/components/ThemeMenu";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	Download,
	Ellipsis,
	PanelLeft,
	Settings2,
	Undo2,
	Redo2,
	ZoomIn,
	ZoomOut,
	Eye,
	Pencil,
	ExternalLink,
	Save,
	Upload,
	RotateCcw,
	History,
	Files,
	Plus,
} from "lucide-react";
import { isResumeLike, normalizeResume, uid, type Resume } from "@shared/schema";
import { EditorForm, type EditorTab } from "@/components/editor/EditorForms";
import { EditorDialog, type EditorPanel } from "@/components/editor/EditorDialog";
import { EditorActions } from "@/components/editor/ListControls";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";
import { SIDEBAR_KEY, readLocalValue, writeLocalValue } from "@/lib/storage";
import { cleanFilename, pdfFilename, downloadJson, readJsonFile } from "@/lib/resumeFiles";
import { cn } from "@/lib/utils";

const TABS: { id: EditorTab; label: string }[] = [
	{ id: "basics", label: "基本信息" },
	{ id: "education", label: "教育经历" },
	{ id: "experience", label: "工作经验" },
	{ id: "projects", label: "项目经历" },
	{ id: "skills", label: "专业技能" },
	{ id: "awards", label: "获奖" },
	{ id: "publications", label: "论文" },
	{ id: "languages", label: "语言" },
	{ id: "custom", label: "自定义" },
];
const A4_PX = (210 * 96) / 25.4;

export function EditorPage() {
	const model = useWorkspace();
	const navigate = useNavigate();
	const lastContentTab = useRef<EditorTab>("basics");
	const { resume, setResume } = model;
	const [tab, setTab] = useState<EditorTab>("basics");
	const [panel, setPanel] = useState<EditorPanel | null>(null);
	const [imported, setImported] = useState<Resume | null>(null);
	const [preview, setPreview] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(() => {
		try {
			return window.matchMedia("(max-width: 1023px)").matches || readLocalValue(SIDEBAR_KEY) !== "0";
		} catch {
			return true;
		}
	});
	const [fitScale, setFitScale] = useState(0.72);
	const [zoom, setZoom] = useState<number | null>(null);
	const [layout, setLayout] = useState<ResumeLayoutInfo>({ pageCount: 1, height: (A4_PX * 297) / 210 });
	const fileRef = useRef<HTMLInputElement>(null);
	const stageRef = useRef<HTMLElement>(null);
	const formRef = useRef<HTMLElement>(null);
	const positions = useRef<Partial<Record<EditorTab, number>>>({});
	const scale = zoom ?? fitScale;
	const mode = resume.meta.layoutMode;
	const handleLayout = useCallback((info: ResumeLayoutInfo) => setLayout(info), []);
	const toggleSidebar = useCallback(() => {
		const next = preview || !sidebarOpen;
		setPreview(!next && window.matchMedia("(max-width: 1023px)").matches);
		setSidebarOpen(next);
		try {
			writeLocalValue(SIDEBAR_KEY, next ? "1" : "0");
		} catch {
			/* Optional preference. */
		}
	}, [preview, sidebarOpen]);
	useEffect(() => {
		const node = stageRef.current;
		if (!node) return;
		const measure = () => {
			if (node.clientWidth) setFitScale(Math.min(1, Math.max(0.1, (node.clientWidth - 32) / A4_PX)));
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		window.addEventListener("resize", measure);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [preview, sidebarOpen]);
	useEffect(() => {
		const key = (e: KeyboardEvent) => {
			if (!(e.ctrlKey || e.metaKey) || e.altKey || e.repeat) return;
			if (e.key.toLowerCase() === "s") {
				e.preventDefault();
				model.flushLocal();
			}
			if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable=true]"))
				return;
			if (e.key.toLowerCase() === "z") {
				e.preventDefault();
				if (e.shiftKey) model.redo();
				else model.undo();
			}
			if (e.key.toLowerCase() === "b") {
				e.preventDefault();
				toggleSidebar();
			}
		};
		window.addEventListener("keydown", key);
		return () => window.removeEventListener("keydown", key);
	});
	const selectTab = (next: EditorTab) => {
		if (formRef.current) positions.current[tab] = formRef.current.scrollTop;
		if (next !== "theme") lastContentTab.current = next;
		setTab(next);
		setPreview(false);
		setSidebarOpen(true);
	};
	useEffect(() => {
		if (formRef.current) formRef.current.scrollTop = positions.current[tab] ?? 0;
	}, [tab]);
	useEffect(() => {
		setTab("basics");
		positions.current = {};
		setPreview(false);
	}, [model.activeId]);
	const props = { resume, setResume: (updater: (current: Resume) => Resume) => setResume(updater) };
	const readFile = async (file: File) => {
		try {
			if (file.size > 5 * 1024 * 1024) throw new Error("备份大于 5 MB，请先压缩照片后再导入");
			const json = await readJsonFile(file);
			if (!isResumeLike(json)) throw new Error("这不是有效的简历备份，请选择 JSON 文件");
			setImported(normalizeResume(json));
			setPanel("import");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "无法读取文件");
		}
	};
	const localLabel = model.localError ? "本机保存失败" : model.localPending ? "保存中…" : "已保存到本机";
	const newSection = () => {
		selectTab("custom");
		if (!resume.customSections.length)
			setResume((c) => ({ ...c, customSections: [{ id: uid("sec"), title: "自定义区块", items: [] }] }));
	};

	const openWebPreview = () => {
		if (model.flushLocal()) navigate("/resume", { state: { fromEditor: true } });
	};
	const changeMode = (next: boolean) => {
		model.flushLocal();
		setPreview(next);
		if (!next) setSidebarOpen(true);
	};

	return (
		<EditorActions.Provider value={{ remove: model.removeWithUndo }}>
			<div className="studio-app" data-view={preview ? "preview" : "edit"}>
				<header className="studio-toolbar no-print">
					<div className="editor-toolbar-row">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleSidebar}
							aria-label={preview || !sidebarOpen ? "打开编辑栏" : "收起编辑栏"}
							title="切换编辑栏（⌘B / Ctrl+B）"
							aria-keyshortcuts="Meta+B Control+B"
							aria-pressed={sidebarOpen && !preview}
							className="sidebar-toggle rounded-full"
						>
							<PanelLeft />
						</Button>
						<strong className="editor-brand shrink-0 text-[15px]">一纸简历</strong>
						<div className="editor-mode-tabs" role="tablist" aria-label="工作区模式">
							{[
								{ preview: false, label: "编辑模式", icon: Pencil },
								{ preview: true, label: "预览模式", icon: Eye },
							].map((item) => (
								<button
									key={item.label}
									type="button"
									role="tab"
									aria-selected={preview === item.preview}
									tabIndex={preview === item.preview ? 0 : -1}
									onClick={() => changeMode(item.preview)}
									onKeyDown={(e) => {
										if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
											e.preventDefault();
											const next = e.key === "Home" ? false : e.key === "End" ? true : !preview;
											changeMode(next);
											const tabs =
												e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]");
											tabs?.[next ? 1 : 0].focus();
										}
									}}
								>
									<item.icon />
									{item.label}
								</button>
							))}
						</div>
						<div className="editor-format-tabs" aria-label="纸张格式">
							{(
								[
									{ id: "single", label: "长页" },
									{ id: "multi", label: "A4" },
								] as const
							).map((item) => (
								<button
									key={item.id}
									aria-pressed={mode === item.id}
									onClick={() => setResume((c) => ({ ...c, meta: { ...c.meta, layoutMode: item.id } }))}
								>
									{item.label}
								</button>
							))}
						</div>
						<div className="editor-toolbar-actions">
							<ThemeMenu />
							<div className="editor-history-actions">
								<Button
									size="icon"
									variant="ghost"
									aria-label="撤销修改"
									title="撤销修改"
									disabled={!model.canUndo}
									onClick={model.undo}
								>
									<Undo2 />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									aria-label="重做修改"
									title="重做修改"
									disabled={!model.canRedo}
									onClick={model.redo}
								>
									<Redo2 />
								</Button>
							</div>
							<Button
								size="sm"
								aria-label="导出简历"
								onClick={() => {
									setPanel("export");
								}}
							>
								<Download />
								<span className="toolbar-action-label">导出</span>
							</Button>
							<Button
								size="sm"
								variant="outline"
								aria-label="网页预览"
								title="网页预览"
								onClick={openWebPreview}
							>
								<ExternalLink />
								<span className="toolbar-action-label">网页预览</span>
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											size="icon"
											variant="ghost"
											aria-label="更多操作"
											className="relative rounded-full"
										/>
									}
								>
									<Ellipsis />
									{model.localError && (
										<span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-600" />
									)}
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="editor-more-menu w-64">
									<div className="px-1.5 pb-1 text-xs text-muted-foreground" role="status">
										{localLabel}
									</div>
									{model.localError && (
										<p role="alert" className="px-1.5 text-xs text-red-700 dark:text-red-300">
											{model.localError}
										</p>
									)}
									<DropdownMenuSeparator />
									{model.localError && (
										<DropdownMenuItem onClick={() => model.flushLocal()}>
											<Save />
											重试本机保存
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										onClick={() =>
											downloadJson(resume, `${cleanFilename(pdfFilename(resume)).replace(/\.pdf$/, "")}.json`)
										}
									>
										<Download />
										导出 JSON
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => fileRef.current?.click()}>
										<Upload />
										导入 JSON
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setPanel("reset")}>
										<RotateCcw />
										重置示例
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => setPanel("recovery")}>
										<History />
										查看恢复点
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											setPanel("manage");
										}}
									>
										<Files />
										管理简历
									</DropdownMenuItem>
									<div className="compact-history">
										<DropdownMenuSeparator />
										<DropdownMenuItem disabled={!model.canUndo} onClick={model.undo}>
											<Undo2 />
											撤销修改
										</DropdownMenuItem>
										<DropdownMenuItem disabled={!model.canRedo} onClick={model.redo}>
											<Redo2 />
											重做修改
										</DropdownMenuItem>
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</header>
				<div className="studio-main">
					<aside
						className="studio-sidebar no-print"
						data-open={sidebarOpen && !preview}
						aria-hidden={!sidebarOpen || preview}
						inert={!sidebarOpen || preview}
					>
						<div className="studio-sidebar-inner">
							<nav className="studio-sidebar-nav" aria-label="简历栏目">
								{TABS.map((item) => (
									<button
										key={item.id}
										aria-current={tab === item.id ? "page" : undefined}
										onClick={() => (item.id === "custom" ? newSection() : selectTab(item.id))}
										className={cn(
											"pressable inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] transition-colors duration-100",
											tab === item.id
												? "bg-primary font-medium text-primary-foreground"
												: "text-muted-foreground hover:bg-card hover:text-foreground",
											item.id === "custom" && "border border-dashed",
											item.id === "custom" &&
												(tab === "custom" ? "border-primary" : "border-border hover:border-ring"),
											item.id !== "basics" &&
												item.id !== "theme" &&
												resume.meta.hiddenSections.includes(item.id) &&
												tab !== item.id &&
												"opacity-40",
										)}
									>
										{item.id === "custom" && <Plus className="size-3" />}
										{item.label}
									</button>
								))}
							</nav>
							<section ref={formRef} className="studio-sidebar-form">
								<h2 className="mb-3 text-[15px] font-semibold">
									{tab === "theme" ? "版式" : TABS.find((t) => t.id === tab)?.label}
								</h2>
								{tab !== "basics" && tab !== "theme" && resume.meta.hiddenSections.includes(tab) && (
									<p className="mb-3 text-sm text-amber-800 dark:text-amber-300">
										此栏目已隐藏，不会导出。
										<button
											className="ml-1 underline"
											onClick={() =>
												setResume((c) => ({
													...c,
													meta: { ...c.meta, hiddenSections: c.meta.hiddenSections.filter((k) => k !== tab) },
												}))
											}
										>
											恢复显示
										</button>
									</p>
								)}
								<EditorForm tab={tab} {...props} />
							</section>
							<div className="studio-sidebar-footer">
								<button
									type="button"
									aria-pressed={tab === "theme"}
									onClick={() => selectTab(tab === "theme" ? lastContentTab.current : "theme")}
									className={cn(
										"pressable flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors",
										tab === "theme"
											? "bg-primary font-medium text-primary-foreground hover:bg-primary/90"
											: "bg-card text-foreground hover:bg-muted hover:shadow-sm",
									)}
								>
									<Settings2 className="size-4 opacity-70" />
									<span className="flex-1">版式</span>
									<span
										className={cn(
											"text-xs",
											tab === "theme" ? "text-primary-foreground/60" : "text-muted-foreground",
										)}
									>
										{mode === "single" ? "长页" : "A4"}
									</span>
								</button>
							</div>
						</div>
					</aside>
					<section ref={stageRef} className="preview-stage" aria-label="当前简历预览">
						<div className="preview-tools no-print">
							<Button
								size="icon"
								variant="ghost"
								aria-label="缩小预览"
								onClick={() => setZoom(Math.max(0.2, scale - 0.1))}
							>
								<ZoomOut />
							</Button>
							<span className="min-w-10 text-center text-xs">{Math.round(scale * 100)}%</span>
							<Button
								size="icon"
								variant="ghost"
								aria-label="放大预览"
								onClick={() => setZoom(Math.min(2, scale + 0.1))}
							>
								<ZoomIn />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									setZoom(null);
									if (stageRef.current) setFitScale(Math.min(1, (stageRef.current.clientWidth - 32) / A4_PX));
								}}
							>
								适应宽度
							</Button>
							<Button size="sm" variant="ghost" onClick={() => setZoom(1)}>
								100%
							</Button>
						</div>
						<div
							className="preview-paper"
							style={{ width: A4_PX * scale, height: Math.max(layout.height, 120) * scale }}
							onDoubleClick={(e) => {
								const block =
									(e.target as HTMLElement).closest<HTMLElement>("[data-section]")?.dataset.section ??
									"basics";
								const key = TABS.find((t) => block === t.id);
								if (key) selectTab(key.id);
							}}
						>
							<div
								className="preview-scale"
								style={{ transform: `scale(${scale})`, width: A4_PX, minHeight: layout.height }}
							>
								<div className="resume-frame">
									<ResumeDocument resume={resume} onLayout={handleLayout} />
								</div>
							</div>
						</div>
						<p className="preview-meta no-print">
							{mode === "single" ? "长页 PDF（图片内容）" : `A4 PDF · ${layout.pageCount} 页`}
						</p>
					</section>
				</div>
				<input
					aria-label="选择简历备份"
					ref={fileRef}
					type="file"
					accept=".json,application/json"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						e.target.value = "";
						if (file) void readFile(file);
					}}
				/>
			</div>
			{panel && (
				<EditorDialog
					key={panel}
					panel={panel}
					imported={imported}
					preview={preview}
					overflow={layout.overflow}
					onPreviewChange={setPreview}
					onClose={() => setPanel(null)}
				/>
			)}
		</EditorActions.Provider>
	);
}
