import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Ellipsis, PanelLeft, Settings2, Undo2, Redo2, ZoomIn, ZoomOut, Eye, Pencil, ExternalLink, Save, Upload, RotateCcw, History, Files, Plus } from "lucide-react";
import { isResumeLike, normalizeResume, uid, type Resume } from "@shared/schema";
import { AwardsForm, BasicsForm, CustomSectionsForm, EducationForm, ExperienceForm, LanguagesForm, ProjectsForm, PublicationsForm, SkillsForm, ThemeForm, type EditorTab } from "@/components/editor/EditorForms";
import { EditorActions } from "@/components/editor/ListControls";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useResume } from "@/hooks/useResume";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";
import { exportResumePdf } from "@/lib/exportResume";
import { downloadJson, readJsonFile, SIDEBAR_KEY, readLocalValue, writeLocalValue } from "@/lib/storage";
import { cleanFilename, pdfFilename } from "@/lib/draftStore";
import { cn } from "@/lib/utils";

const TABS: { id: EditorTab; label: string }[] = [
	{ id: "basics", label: "基本信息" }, { id: "education", label: "教育经历" }, { id: "experience", label: "工作经验" },
	{ id: "projects", label: "项目经历" }, { id: "skills", label: "专业技能" }, { id: "awards", label: "获奖" },
	{ id: "publications", label: "论文" }, { id: "languages", label: "语言" }, { id: "custom", label: "自定义" },
];
const A4_PX = 210 * 96 / 25.4;
type Panel = "import" | "export" | "recovery" | "manage" | "reset" | null;
const stamp = (time: string | null) => time ? new Date(time).toLocaleString("zh-CN", { hour12: false }) : "尚未保存";

export function EditorPage() {
	const model = useResume();
	const navigate = useNavigate();
	const lastContentTab = useRef<EditorTab>("basics");
	const { resume, setResume } = model;
	const [tab, setTab] = useState<EditorTab>("basics");
	const [panel, setPanel] = useState<Panel>(null);
	const [imported, setImported] = useState<Resume | null>(null);
	const [filename, setFilename] = useState("");
	const [exporting, setExporting] = useState(false);
	const [printHelp, setPrintHelp] = useState(() => { try { return localStorage.getItem("yizhi:print-help") !== "off"; } catch { return true; } });
	const [rename, setRename] = useState("");
	const [preview, setPreview] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(() => { try { return window.matchMedia("(max-width: 1023px)").matches || readLocalValue(SIDEBAR_KEY) !== "0"; } catch { return true; } });
	const [fitScale, setFitScale] = useState(.72);
	const [zoom, setZoom] = useState<number | null>(null);
	const [layout, setLayout] = useState<ResumeLayoutInfo>({ pageCount: 1, height: A4_PX * 297 / 210 });
	const fileRef = useRef<HTMLInputElement>(null);
	const stageRef = useRef<HTMLElement>(null);
	const formRef = useRef<HTMLElement>(null);
	const positions = useRef<Partial<Record<EditorTab, number>>>({});
	const scale = zoom ?? fitScale;
	const mode = resume.meta.layoutMode;
	const handleLayout = useCallback((info: ResumeLayoutInfo) => setLayout(info), []);
	const toggleSidebar = useCallback(() => {
		const next = preview || !sidebarOpen;
		setPreview(!next && window.matchMedia("(max-width: 1023px)").matches); setSidebarOpen(next);
		try { writeLocalValue(SIDEBAR_KEY, next ? "1" : "0"); } catch { /* Optional preference. */ }
	}, [preview, sidebarOpen]);
	useEffect(() => {
		const node = stageRef.current; if (!node) return;
		const measure = () => { if (node.clientWidth) setFitScale(Math.min(1, Math.max(.1, (node.clientWidth - 32) / A4_PX))); };
		measure(); const observer = new ResizeObserver(measure); observer.observe(node);
		window.addEventListener("resize", measure);
		return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
	}, [preview, sidebarOpen]);
	useEffect(() => {
		const key = (e: KeyboardEvent) => {
			if (!(e.ctrlKey || e.metaKey) || e.altKey || e.repeat) return;
			if (e.key.toLowerCase() === "s") { e.preventDefault(); model.flushLocal(); }
			if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable=true]")) return;
			if (e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) model.redo(); else model.undo(); }
			if (e.key.toLowerCase() === "b") { e.preventDefault(); toggleSidebar(); }
		};
		window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
	});
	const selectTab = (next: EditorTab) => {
		if (formRef.current) positions.current[tab] = formRef.current.scrollTop;
		if (next !== "theme") lastContentTab.current = next;
		setTab(next); setPreview(false); setSidebarOpen(true);
	};
	useEffect(() => { if (formRef.current) formRef.current.scrollTop = positions.current[tab] ?? 0; }, [tab]);
	useEffect(() => { setTab("basics"); positions.current = {}; setPreview(false); }, [model.activeId]);
	const props = { resume, setResume: (updater: (current: Resume) => Resume) => setResume(updater) };
	const warning: string[] = [];
	if (!resume.basics.name.trim()) warning.push("姓名尚未填写。");
	if (!["email", "phone"].some(key => !resume.meta.hiddenBasics.includes(key as "email" | "phone") && resume.basics[key as "email" | "phone"]?.trim())) warning.push("邮箱和电话均为空或隐藏，招聘者可能无法联系你。");
	if (layout.overflow) warning.push("存在超长条目，请检查分页和打印预览中的裁切。");
	const exportPdf = async () => {
		setExporting(true);
		const previousPreview = preview;
		setPreview(true);
		await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
		try {
			await exportResumePdf(mode, cleanFilename(filename));
			setPanel(null);
		} catch (error) { toast.error(error instanceof Error ? error.message : "导出失败，请重试；当前内容仍保留在编辑器"); }
		finally { setExporting(false); setPreview(previousPreview); }
	};
	const readFile = async (file: File) => {
		try {
			if (file.size > 5 * 1024 * 1024) throw new Error("备份大于 5 MB，请先压缩照片后再导入");
			const json = await readJsonFile(file); if (!isResumeLike(json)) throw new Error("这不是有效的简历备份，请选择 JSON 文件");
			setImported(normalizeResume(json)); setPanel("import");
		} catch (error) { toast.error(error instanceof Error ? error.message : "无法读取文件"); }
	};
	const localLabel = model.localError ? "本机保存失败" : model.localPending ? "保存中…" : "已保存到本机";
	const newSection = () => { selectTab("custom"); if (!resume.customSections.length) setResume(c => ({ ...c, customSections: [{ id: uid("sec"), title: "自定义区块", items: [] }] })); };

	const openWebPreview = () => { if (model.flushLocal()) navigate("/resume", { state: { fromEditor: true } }); };
	const changeMode = (next: boolean) => { model.flushLocal(); setPreview(next); if (!next) setSidebarOpen(true); };

	return <EditorActions.Provider value={{ remove: model.removeWithUndo }}>
		<div className="studio-app" data-view={preview ? "preview" : "edit"}>
			<header className="studio-toolbar no-print">
				<div className="editor-toolbar-row">
					<Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label={preview || !sidebarOpen ? "打开编辑栏" : "收起编辑栏"} title="切换编辑栏（⌘B / Ctrl+B）" aria-keyshortcuts="Meta+B Control+B" aria-pressed={sidebarOpen && !preview} className="sidebar-toggle rounded-full"><PanelLeft /></Button>
					<strong className="editor-brand shrink-0 text-[15px]">一纸简历</strong>
					<div className="editor-mode-tabs" role="tablist" aria-label="工作区模式">
						{[{ preview: false, label: "编辑模式", icon: Pencil }, { preview: true, label: "预览模式", icon: Eye }].map(item => <button key={item.label} type="button" role="tab" aria-selected={preview === item.preview} tabIndex={preview === item.preview ? 0 : -1} onClick={() => changeMode(item.preview)} onKeyDown={e => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) { e.preventDefault(); const next = e.key === "Home" ? false : e.key === "End" ? true : !preview; changeMode(next); const tabs = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]"); tabs?.[next ? 1 : 0].focus(); } }}><item.icon />{item.label}</button>)}
					</div>
					<div className="editor-format-tabs" aria-label="纸张格式">
						{([{ id: "single", label: "长页" }, { id: "multi", label: "A4" }] as const).map(item => <button key={item.id} aria-pressed={mode === item.id} onClick={() => setResume(c => ({ ...c, meta: { ...c.meta, layoutMode: item.id } }))}>{item.label}</button>)}
					</div>
					<div className="editor-toolbar-actions">
						<div className="editor-history-actions">
							<Button size="icon" variant="ghost" aria-label="撤销修改" title="撤销修改" disabled={!model.canUndo} onClick={model.undo}><Undo2 /></Button>
							<Button size="icon" variant="ghost" aria-label="重做修改" title="重做修改" disabled={!model.canRedo} onClick={model.redo}><Redo2 /></Button>
						</div>
						<Button size="sm" aria-label="导出简历" onClick={() => { setFilename(pdfFilename(resume)); setPanel("export"); }}><Download /><span className="toolbar-action-label">导出</span></Button>
						<Button size="sm" variant="outline" aria-label="网页预览" title="网页预览" onClick={openWebPreview}><ExternalLink /><span className="toolbar-action-label">网页预览</span></Button>
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button size="icon" variant="ghost" aria-label="更多操作" className="relative rounded-full" />}><Ellipsis />{model.localError && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-600" />}</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="editor-more-menu w-64">
								<div className="px-1.5 pb-1 text-xs text-neutral-500" role="status">{localLabel}</div>
								{model.localError && <p role="alert" className="px-1.5 text-xs text-red-700">{model.localError}</p>}
								<DropdownMenuSeparator />
								{model.localError && <DropdownMenuItem onClick={() => model.flushLocal()}><Save />重试本机保存</DropdownMenuItem>}
								<DropdownMenuItem onClick={() => downloadJson(resume, `${cleanFilename(pdfFilename(resume)).replace(/\.pdf$/, "")}.json`)}><Download />导出 JSON</DropdownMenuItem>
								<DropdownMenuItem onClick={() => fileRef.current?.click()}><Upload />导入 JSON</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setPanel("reset")}><RotateCcw />重置示例</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setPanel("recovery")}><History />查看恢复点</DropdownMenuItem>
								<DropdownMenuItem onClick={() => { setRename(model.drafts.find(d => d.id === model.activeId)!.name); setPanel("manage"); }}><Files />管理简历</DropdownMenuItem>
								<div className="compact-history"><DropdownMenuSeparator /><DropdownMenuItem disabled={!model.canUndo} onClick={model.undo}><Undo2 />撤销修改</DropdownMenuItem><DropdownMenuItem disabled={!model.canRedo} onClick={model.redo}><Redo2 />重做修改</DropdownMenuItem></div>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>
			<div className="studio-main">
				<aside className="studio-sidebar no-print" data-open={sidebarOpen && !preview} aria-hidden={!sidebarOpen || preview} inert={!sidebarOpen || preview}>
					<div className="studio-sidebar-inner">
						<nav className="studio-sidebar-nav" aria-label="简历栏目">
							{TABS.map(item => <button key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => item.id === "custom" ? newSection() : selectTab(item.id)} className={cn("pressable inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] transition-colors duration-100", tab === item.id ? "bg-neutral-900 font-medium text-white" : "text-neutral-500 hover:bg-white hover:text-neutral-800", item.id === "custom" && "border border-dashed", item.id === "custom" && (tab === "custom" ? "border-neutral-900" : "border-neutral-300 hover:border-neutral-400"), item.id !== "basics" && item.id !== "theme" && resume.meta.hiddenSections.includes(item.id) && tab !== item.id && "opacity-40")}>{item.id === "custom" && <Plus className="size-3" />}{item.label}</button>)}
						</nav>
						<section ref={formRef} className="studio-sidebar-form">
							<h2 className="mb-3 text-[15px] font-semibold">{tab === "theme" ? "版式" : TABS.find(t => t.id === tab)?.label}</h2>
							{tab !== "basics" && tab !== "theme" && resume.meta.hiddenSections.includes(tab) && <p className="mb-3 text-sm text-amber-800">此栏目已隐藏，不会导出。<button className="ml-1 underline" onClick={() => setResume(c => ({ ...c, meta: { ...c.meta, hiddenSections: c.meta.hiddenSections.filter(k => k !== tab) } }))}>恢复显示</button></p>}
							{tab === "basics" && <BasicsForm {...props} />}{tab === "education" && <EducationForm {...props} />}{tab === "experience" && <ExperienceForm {...props} />}{tab === "projects" && <ProjectsForm {...props} />}{tab === "skills" && <SkillsForm {...props} />}{tab === "awards" && <AwardsForm {...props} />}{tab === "publications" && <PublicationsForm {...props} />}{tab === "languages" && <LanguagesForm {...props} />}{tab === "custom" && <CustomSectionsForm {...props} />}{tab === "theme" && <ThemeForm {...props} />}
						</section>
						<div className="studio-sidebar-footer"><button type="button" aria-pressed={tab === "theme"} onClick={() => selectTab(tab === "theme" ? lastContentTab.current : "theme")} className={cn("pressable flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors", tab === "theme" ? "bg-neutral-900 font-medium text-white hover:bg-neutral-800" : "bg-white text-neutral-700 hover:bg-neutral-50 hover:shadow-sm")}><Settings2 className="size-4 opacity-70" /><span className="flex-1">版式</span><span className={cn("text-xs", tab === "theme" ? "text-white/60" : "text-neutral-400")}>{mode === "single" ? "长页" : "A4"}</span></button></div>
					</div>
				</aside>
				<section ref={stageRef} className="preview-stage" aria-label="当前简历预览">
					<div className="preview-tools no-print">
						<Button size="icon" variant="ghost" aria-label="缩小预览" onClick={() => setZoom(Math.max(.2, scale - .1))}><ZoomOut /></Button>
						<span className="min-w-10 text-center text-xs">{Math.round(scale * 100)}%</span>
						<Button size="icon" variant="ghost" aria-label="放大预览" onClick={() => setZoom(Math.min(2, scale + .1))}><ZoomIn /></Button>
						<Button size="sm" variant="ghost" onClick={() => { setZoom(null); if (stageRef.current) setFitScale(Math.min(1, (stageRef.current.clientWidth - 32) / A4_PX)); }}>适应宽度</Button><Button size="sm" variant="ghost" onClick={() => setZoom(1)}>100%</Button>
					</div>
					<div className="preview-paper" style={{ width: A4_PX * scale, height: Math.max(layout.height, 120) * scale }} onDoubleClick={e => {
						const block = (e.target as HTMLElement).closest<HTMLElement>("[data-section]")?.dataset.section ?? "basics";
						const key = TABS.find(t => block === t.id); if (key) selectTab(key.id);
					}}>
						<div className="preview-scale" style={{ transform: `scale(${scale})`, width: A4_PX, minHeight: layout.height }}><div className="resume-frame"><ResumeDocument resume={resume} onLayout={handleLayout} /></div></div>
					</div>
					<p className="preview-meta no-print">{mode === "single" ? "长页 PDF（图片内容）" : `A4 PDF · ${layout.pageCount} 页`}</p>
				</section>
			</div>
			<input aria-label="选择简历备份" ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void readFile(file); }} />
		</div>
		<Dialog open={panel !== null} onOpenChange={open => { if (!open && !exporting) setPanel(null); }}><DialogContent className="max-h-[85dvh] overflow-auto sm:max-w-lg">
			<DialogTitle>{({ import: "从备份恢复", export: "导出简历", recovery: "恢复点", manage: "我的简历", reset: "恢复示例内容" } as const)[panel ?? "export"]}</DialogTitle>
			<DialogDescription>{panel === "import" ? "确认后才替换当前内容，替换前会自动创建恢复点。" : panel === "recovery" ? "每份简历保留最近 5 次重要操作前的内容，恢复前也会备份当前稿。" : panel === "export" ? "导出当前编辑内容。" : panel === "reset" ? "当前内容将替换为示例，替换前会创建恢复点。" : "简历保存在当前浏览器中，可通过 JSON 导出备份。"}</DialogDescription>
			{panel === "import" && imported && <>
				<p>{imported.basics.name || "未填写姓名"} · 工作经历 {imported.experience.length} 条 · 项目 {imported.projects.length} 条 · 教育 {imported.education.length} 条</p>
				<Button onClick={() => { if (model.started ? model.replace(imported) : model.newDraft("blank", imported)) { setPanel(null); toast.success("已恢复备份"); } }}>确认替换</Button>
				{model.started && <Button variant="outline" onClick={() => { if (model.newDraft("blank", imported)) setPanel(null); }}>另存为新简历</Button>}
			</>}
			{panel === "export" && <>
				<label className="grid gap-2">文件名<Input value={filename} onChange={e => setFilename(e.target.value)} /></label>
				<label className="grid gap-2">导出格式<select className="editor-select" value={mode} onChange={e => setResume(c => ({ ...c, meta: { ...c.meta, layoutMode: e.target.value as "multi" | "single" } }))}><option value="multi">A4 PDF（文字内容）</option><option value="single">长页 PDF（图片内容）</option></select></label>
				{warning.length > 0 && <ul className="list-disc pl-5 text-amber-800">{warning.map(w => <li key={w}>{w}</li>)}</ul>}
				{mode === "multi" && printHelp && <div className="rounded-lg bg-neutral-100 p-3 text-sm leading-6">在打印窗口选择“另存为 PDF”，纸张选 A4，缩放为 100%，关闭页眉和页脚。请检查预览后保存。<label className="mt-2 flex items-center gap-2"><input type="checkbox" onChange={e => { try { localStorage.setItem("yizhi:print-help", e.target.checked ? "off" : "on"); } catch { /* Optional preference. */ } }} /> 下次不再提示</label></div>}
				{mode === "single" && <p className="text-neutral-600">此格式生成 PDF，文字以图片呈现，不是 PNG/JPG。投递简历建议使用 A4 PDF。</p>}
				<Button disabled={exporting} onClick={() => { void exportPdf().then(() => { try { setPrintHelp(localStorage.getItem("yizhi:print-help") !== "off"); } catch { /* Optional preference. */ } }); }}>{exporting ? "正在准备…" : mode === "multi" ? "打开打印窗口" : "下载长页 PDF"}</Button>
			</>}
			{panel === "reset" && <Button onClick={() => { if (model.resetSample()) setPanel(null); }}>确认恢复示例</Button>}
			{panel === "recovery" && <>{!model.backups.length && <p>还没有恢复点。导入或重置前会自动创建。</p>}{model.backups.map(b => <div key={b.id} className="border-b pb-3"><p>{b.label} · {b.data.basics.name || "未填写姓名"}</p><p className="my-2 text-xs text-neutral-500">{stamp(b.time)}</p><div className="flex gap-2"><Button size="sm" onClick={() => { if (model.restore(b.id)) { setPanel(null); toast.success("已恢复，可继续撤销"); } }}>恢复</Button><Button size="sm" variant="outline" onClick={() => downloadJson(b.data, `恢复点-${b.time.slice(0, 10)}.json`)}>下载</Button><Button size="sm" variant="ghost" onClick={() => model.removeBackup(b.id)}>删除恢复点</Button></div></div>)}</>}
			{panel === "manage" && <>
				<label className="grid gap-2">当前简历名称<Input value={rename} onChange={e => setRename(e.target.value)} maxLength={80} /></label><Button variant="outline" onClick={() => { model.rename(rename); if (model.flushLocal()) toast.success("已更新名称"); }}>保存名称</Button>
				<div className="grid gap-2">{model.drafts.map(d => <Button key={d.id} variant={d.id === model.activeId ? "secondary" : "outline"} onClick={() => { if (model.switchDraft(d.id)) setRename(d.name); }}>{d.name}{d.id === model.activeId ? "（当前）" : ""}</Button>)}</div>
				<div className="flex flex-wrap gap-2"><Button onClick={() => { if (model.newDraft("blank")) setPanel(null); }}>新建空白简历</Button><Button variant="outline" onClick={() => { if (model.newDraft("copy")) setPanel(null); }}>复制当前简历</Button></div>
<p className="text-xs text-neutral-500">数据仅保存在当前浏览器；清除浏览器数据后会恢复样例。请导出 JSON 备份。</p>
			</>}
			<Button variant="ghost" disabled={exporting} onClick={() => setPanel(null)}>取消 / 返回编辑</Button>
		</DialogContent></Dialog>
	</EditorActions.Provider>;
}
