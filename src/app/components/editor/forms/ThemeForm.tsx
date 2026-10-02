import { type SectionKey, toggleHidden } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Field, VisibilityToggle } from "../ListControls";
import { SortableList } from "../SortableList";
import { type FormProps, patchMeta } from "./shared";

const SECTION_LABELS: Record<SectionKey, string> = {
	skills: "专业技能",
	experience: "工作 / 实习",
	projects: "项目经历",
	education: "教育经历",
	awards: "获奖",
	publications: "论文",
	languages: "语言",
	custom: "自定义",
};

export function ThemeForm({ resume, setResume }: FormProps) {
	const meta = resume.meta;
	const layoutMode = meta.layoutMode === "multi" ? "multi" : "single";
	return (
		<div className="grid gap-5">
			<div>
				<p className="mb-2 text-sm font-medium text-foreground">纸张排版</p>
				<div className="grid grid-cols-2 gap-2">
					{(
						[
							{ id: "single", title: "长页 PDF", hint: "图片内容，不可直接选中文字，适合浏览" },
							{ id: "multi", title: "A4", hint: "分页高保真文字稿，适合打印和投递" },
						] as const
					).map((option) => (
						<button
							key={option.id}
							aria-pressed={layoutMode === option.id}
							type="button"
							onClick={() =>
								setResume((current) => ({
									...current,
									meta: { ...current.meta, layoutMode: option.id },
								}))
							}
							className={cn(
								"pressable rounded-xl border px-3 py-3 text-left transition-colors duration-100",
								layoutMode === option.id
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-card text-foreground hover:bg-muted",
							)}
						>
							<p className="text-sm font-medium">{option.title}</p>
							<p
								className={cn(
									"mt-1 text-xs leading-relaxed",
									layoutMode === option.id ? "text-primary-foreground/70" : "text-muted-foreground",
								)}
							>
								{option.hint}
							</p>
						</button>
					))}
				</div>
			</div>
			<Field label={`文字大小 ${Math.round(meta.fontScale * 100)}%`}>
				<input
					type="range"
					min={0.85}
					max={1.15}
					step={0.01}
					value={meta.fontScale}
					onChange={(e) => patchMeta(setResume, { fontScale: Number(e.target.value) })}
				/>
			</Field>
			<div>
				<p className="mb-2 text-sm font-medium text-foreground">栏目顺序</p>
				<SortableList
					items={meta.sectionOrder}
					getId={(key) => key}
					onReorder={(sectionOrder) => patchMeta(setResume, { sectionOrder })}
				>
					{(key, { handle, dragging }) => {
						const hidden = meta.hiddenSections.includes(key);
						return (
							<div
								className={cn(
									"flex items-center gap-1.5 rounded-xl border border-black/8 bg-card px-1.5 py-1",
									dragging && "shadow-md",
									hidden && "opacity-45",
								)}
							>
								{handle}
								<span className="min-w-0 flex-1 px-1 text-sm">{SECTION_LABELS[key] ?? key}</span>
								<VisibilityToggle
									visible={!hidden}
									onToggle={() =>
										patchMeta(setResume, {
											hiddenSections: toggleHidden(meta.hiddenSections, key),
										})
									}
								/>
							</div>
						);
					}}
				</SortableList>
				<p className="mt-2 text-xs text-muted-foreground">
					按住左侧拖动调整顺序，点眼睛隐藏或显示。空栏目即使开启也不会印在简历上。
				</p>
			</div>
		</div>
	);
}
