import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
	Download,
	Ellipsis,
	ExternalLink,
	PanelLeft,
	RotateCcw,
	Save,
	Share,
	Upload,
} from "lucide-react";
import { isResumeLike, normalizeResume } from "@shared/schema";
import {
	AwardsForm,
	BasicsForm,
	CustomSectionsForm,
	EducationForm,
	ExperienceForm,
	LanguagesForm,
	ProjectsForm,
	PublicationsForm,
	SkillsForm,
	ThemeForm,
	type EditorTab,
} from "@/components/editor/EditorForms";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useResume } from "@/hooks/useResume";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";
import { exportResumePdf } from "@/lib/exportResume";
import { downloadJson, readJsonFile } from "@/lib/storage";
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
	{ id: "theme", label: "版式" },
];

const A4_PX = (210 * 96) / 25.4;
const SIDEBAR_KEY = "resume-studio:sidebar";

export function EditorPage() {
	const {
		resume,
		setResume,
		replace,
		resetSample,
		slug,
		setSlug,
		dbAvailable,
		cloudUpdatedAt,
		saving,
		persistCloud,
	} = useResume();
	const [tab, setTab] = useState<EditorTab>("basics");
	const [scale, setScale] = useState(0.72);
	const [layoutInfo, setLayoutInfo] = useState<ResumeLayoutInfo>({ pageCount: 1, height: A4_PX * (297 / 210) });
	const [exporting, setExporting] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(() => {
		if (typeof window === "undefined") return true;
		return window.localStorage.getItem(SIDEBAR_KEY) !== "0";
	});
	const stageRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const layoutMode = resume.meta.layoutMode === "single" ? "single" : "multi";

	const handleLayout = useCallback((info: ResumeLayoutInfo) => {
		setLayoutInfo(info);
	}, []);

	useEffect(() => {
		const before = () => {
			document.querySelectorAll<HTMLElement>(".preview-scale").forEach((el) => {
				el.dataset.prevTransform = el.style.transform;
				el.style.transform = "none";
			});
			document.querySelectorAll<HTMLElement>(".resume-frame").forEach((el) => {
				el.style.boxShadow = "none";
			});
		};
		const after = () => {
			document.querySelectorAll<HTMLElement>(".preview-scale").forEach((el) => {
				if (el.dataset.prevTransform) el.style.transform = el.dataset.prevTransform;
			});
			document.querySelectorAll<HTMLElement>(".resume-frame").forEach((el) => {
				el.style.boxShadow = "";
			});
		};
		window.addEventListener("beforeprint", before);
		window.addEventListener("afterprint", after);
		return () => {
			window.removeEventListener("beforeprint", before);
			window.removeEventListener("afterprint", after);
		};
	}, []);

	useEffect(() => {
		const el = stageRef.current;
		if (!el) return;
		const update = () => {
			const width = el.clientWidth - 48;
			setScale(Math.max(0.36, Math.min(1, width / A4_PX)));
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, [sidebarOpen]);

	const toggleSidebar = () => {
		setSidebarOpen((open) => {
			const next = !open;
			window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
			return next;
		});
	};

	const updateResume = (updater: (current: typeof resume) => typeof resume) => {
		setResume((current) => updater(current));
	};

	const formProps = { resume, setResume: updateResume };
	const sheetHeight = Math.max(layoutInfo.height, 120);
	const fileName = `resume-${slug || "preview"}.pdf`;

	const handleExport = async () => {
		setExporting(true);
		try {
			await exportResumePdf(layoutMode, fileName);
			toast.success(layoutMode === "single" ? "已导出长图 PDF" : "已打开打印对话框");
		} catch (error) {
			console.error(error);
			toast.error("导出失败，请重试");
		} finally {
			setExporting(false);
		}
	};

	return (
		<div className="studio-app">
			<header className="studio-toolbar no-print">
				<div className="flex h-13 items-center gap-3 px-3 sm:px-4">
					<Button
						size="icon"
						variant="ghost"
						onClick={toggleSidebar}
						aria-pressed={sidebarOpen}
						aria-label={sidebarOpen ? "收起编辑栏" : "打开编辑栏"}
						className="size-9 shrink-0 rounded-full"
					>
						<PanelLeft />
					</Button>
					<div className="min-w-0">
						<p className="truncate text-[15px] font-semibold leading-none tracking-tight">简历工坊</p>
					</div>
					<div className="ml-1 flex rounded-full bg-black/5 p-0.5">
						{(
							[
								{ id: "single", label: "长图" },
								{ id: "multi", label: "A4" },
							] as const
						).map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() =>
									setResume((current) => ({
										...current,
										meta: { ...current.meta, layoutMode: option.id },
									}))
								}
								className={cn(
									"pressable rounded-full px-3 py-1 text-xs font-medium transition-colors duration-100",
									layoutMode === option.id
										? "bg-white text-neutral-900 shadow-sm"
										: "text-neutral-500 hover:text-neutral-800",
								)}
							>
								{option.label}
							</button>
						))}
					</div>
					<div className="ml-auto flex items-center gap-2">
						<Button size="sm" disabled={exporting} onClick={() => void handleExport()}>
							<Share />
							{exporting ? "导出中" : layoutMode === "single" ? "导出长图" : "导出 A4"}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button size="icon" variant="ghost" aria-label="更多" className="size-9 rounded-full" />
								}
							>
								<Ellipsis />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-64">
								<DropdownMenuLabel>
									{dbAvailable ? "已连接云端" : "仅保存在此浏览器"}
									{cloudUpdatedAt ? ` · ${cloudUpdatedAt.slice(0, 16).replace("T", " ")}` : ""}
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem render={<Link to={`/r/${slug}`} />}>
									<ExternalLink /> 打开公开页
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										void persistCloud().then((ok) => {
											toast[ok ? "success" : "message"](ok ? "已写入云端" : "当前仅保存在浏览器");
										});
									}}
									disabled={saving}
								>
									<Save /> {saving ? "保存中" : "保存到云端"}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => downloadJson(resume, `resume-${slug}.json`)}>
									<Download /> 导出 JSON
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => fileRef.current?.click()}>
									<Upload /> 导入 JSON
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										if (confirm("恢复为示例简历？未导出的修改会丢失。")) {
											resetSample();
											toast.success("已恢复示例数据");
										}
									}}
								>
									<RotateCcw /> 重置示例
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>公开地址</DropdownMenuLabel>
								<div className="px-2 pb-2">
									<Input
										className="h-8 bg-white"
										value={slug}
										onChange={(e) => setSlug(e.target.value)}
										placeholder="slug"
									/>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>

			<div className="studio-main">
				<aside
					className="studio-sidebar no-print"
					data-open={sidebarOpen}
					aria-hidden={!sidebarOpen}
					inert={!sidebarOpen}
				>
					<div className="studio-sidebar-inner">
						<nav className="studio-sidebar-nav">
							{TABS.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => setTab(item.id)}
									className={cn(
										"pressable rounded-full px-2.5 py-1 text-[13px] transition-colors duration-100",
										tab === item.id
											? "bg-neutral-900 font-medium text-white"
											: "text-neutral-500 hover:bg-white hover:text-neutral-800",
									)}
								>
									{item.label}
								</button>
							))}
						</nav>
						<section className="studio-sidebar-form">
							<h2 className="mb-3 text-[15px] font-semibold tracking-tight">
								{TABS.find((item) => item.id === tab)?.label}
							</h2>
							{tab === "basics" ? <BasicsForm {...formProps} /> : null}
							{tab === "skills" ? <SkillsForm {...formProps} /> : null}
							{tab === "experience" ? <ExperienceForm {...formProps} /> : null}
							{tab === "projects" ? <ProjectsForm {...formProps} /> : null}
							{tab === "education" ? <EducationForm {...formProps} /> : null}
							{tab === "awards" ? <AwardsForm {...formProps} /> : null}
							{tab === "publications" ? <PublicationsForm {...formProps} /> : null}
							{tab === "languages" ? <LanguagesForm {...formProps} /> : null}
							{tab === "custom" ? <CustomSectionsForm {...formProps} /> : null}
							{tab === "theme" ? <ThemeForm {...formProps} /> : null}
						</section>
					</div>
				</aside>

				<section ref={stageRef} className="preview-stage">
					<div
						style={{
							width: `${A4_PX * scale}px`,
							height: `${sheetHeight * scale}px`,
						}}
					>
						<div
							className="preview-scale"
							style={{
								transform: `scale(${scale})`,
								width: `${A4_PX}px`,
								minHeight: `${sheetHeight}px`,
							}}
						>
							<div className="resume-frame">
								<ResumeDocument resume={resume} onLayout={handleLayout} />
							</div>
						</div>
					</div>
					<p className="preview-meta no-print">
						{layoutMode === "single"
							? "长图 · 整页渲染为图片，适合在线分享"
							: `A4 · ${layoutInfo.pageCount} 页文字稿，适合投递`}
					</p>
				</section>
			</div>

			<input
				ref={fileRef}
				type="file"
				accept="application/json"
				className="hidden"
				onChange={async (event) => {
					const file = event.target.files?.[0];
					event.target.value = "";
					if (!file) return;
					try {
						const json = await readJsonFile(file);
						if (!isResumeLike(json)) {
							toast.error("JSON 不是有效简历");
							return;
						}
						replace(normalizeResume(json));
						toast.success("已导入 JSON");
					} catch {
						toast.error("无法解析该文件");
					}
				}}
			/>
		</div>
	);
}
