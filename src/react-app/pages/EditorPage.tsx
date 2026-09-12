import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
	Cloud,
	CloudOff,
	Download,
	ExternalLink,
	Printer,
	RotateCcw,
	Save,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResume } from "@/hooks/useResume";
import { downloadJson, readJsonFile } from "@/lib/storage";
import { cn } from "@/lib/utils";

const TABS: { id: EditorTab; label: string }[] = [
	{ id: "basics", label: "基本信息" },
	{ id: "skills", label: "专业技能" },
	{ id: "experience", label: "工作经验" },
	{ id: "projects", label: "项目经历" },
	{ id: "education", label: "教育经历" },
	{ id: "awards", label: "获奖" },
	{ id: "publications", label: "论文" },
	{ id: "languages", label: "语言" },
	{ id: "custom", label: "自定义" },
	{ id: "theme", label: "主题" },
];

const A4_PX = (210 * 96) / 25.4;

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
	const stageRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const el = stageRef.current;
		if (!el) return;
		const update = () => {
			const width = el.clientWidth - 24;
			setScale(Math.max(0.38, Math.min(1, width / A4_PX)));
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const updateResume = (updater: (current: typeof resume) => typeof resume) => {
		setResume((current) => updater(current));
	};

	const formProps = { resume, setResume: updateResume };

	return (
		<div className="min-h-screen">
			<header className="no-print sticky top-0 z-30 border-b bg-[#faf8f4]/90 backdrop-blur">
				<div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
							简
						</div>
						<div>
							<p className="text-sm font-semibold leading-none">Resume Studio</p>
							<p className="text-xs text-muted-foreground">在线简历工坊</p>
						</div>
					</div>
					<div className="ml-auto flex flex-wrap items-center gap-2">
						{dbAvailable ? (
							<Badge variant="success" className="gap-1">
								<Cloud className="size-3" /> D1 已连接
							</Badge>
						) : (
							<Badge variant="warning" className="gap-1">
								<CloudOff className="size-3" /> 本地草稿
							</Badge>
						)}
						<Input
							className="h-8 w-36"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							title="公开页 slug"
						/>
						<Button
							size="sm"
							variant="outline"
							onClick={async () => {
								const ok = await persistCloud();
								toast[ok ? "success" : "message"](ok ? "已写入 D1" : "当前仅保存在浏览器");
							}}
							disabled={saving}
						>
							<Save /> {saving ? "保存中" : "保存"}
						</Button>
						<Button size="sm" variant="outline" onClick={() => downloadJson(resume, `resume-${slug}.json`)}>
							<Download /> JSON
						</Button>
						<Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
							<Upload /> 导入
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								if (confirm("恢复为商庆达示例简历？未导出的修改会丢失。")) {
									resetSample();
									toast.success("已恢复示例数据");
								}
							}}
						>
							<RotateCcw /> 重置
						</Button>
						<Button size="sm" onClick={() => window.print()}>
							<Printer /> 导出 PDF
						</Button>
						<Button size="sm" variant="secondary" asChild>
							<Link to={`/r/${slug}`}>
								<ExternalLink /> 公开页
							</Link>
						</Button>
					</div>
				</div>
			</header>

			<div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[200px_minmax(320px,420px)_1fr]">
				<nav className="no-print border-b bg-[#faf8f4] px-2 py-3 lg:border-b-0 lg:border-r">
					<div className="flex gap-1 overflow-x-auto lg:flex-col">
						{TABS.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => setTab(item.id)}
								className={cn(
									"rounded-md px-3 py-2 text-left text-sm whitespace-nowrap",
									tab === item.id
										? "bg-white font-medium text-blue-700 shadow-sm"
										: "text-stone-600 hover:bg-white/70",
								)}
							>
								{item.label}
							</button>
						))}
					</div>
					<p className="mt-4 hidden px-3 text-xs leading-relaxed text-muted-foreground lg:block">
						左侧改内容，右侧即 A4 预览。打印或「导出 PDF」使用同一套版式。
						{cloudUpdatedAt ? ` 云端更新于 ${cloudUpdatedAt.slice(0, 16).replace("T", " ")}。` : ""}
					</p>
				</nav>

				<section className="no-print max-h-[calc(100vh-64px)] overflow-y-auto border-b bg-[#f7f4ee] p-4 lg:border-b-0 lg:border-r">
					<h2 className="mb-3 text-base font-semibold">{TABS.find((item) => item.id === tab)?.label}</h2>
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

				<section ref={stageRef} className="preview-stage min-h-[80vh]">
					<div
						className="preview-scale"
						style={{
							transform: `scale(${scale})`,
							width: `${A4_PX}px`,
							minHeight: `${A4_PX * (297 / 210)}px`,
						}}
					>
						<div className="resume-shadow rounded-sm shadow-[0_18px_50px_rgba(28,25,23,0.16)]">
							<ResumeDocument resume={resume} />
						</div>
					</div>
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
