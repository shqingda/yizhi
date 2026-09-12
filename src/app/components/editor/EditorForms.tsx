import { Plus } from "lucide-react";
import type { Resume, SectionKey } from "@shared/schema";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, HighlightsEditor, ListControls, moveItem } from "./ListControls";

export type EditorTab = "basics" | SectionKey | "theme";

interface FormProps {
	resume: Resume;
	setResume: (updater: (current: Resume) => Resume) => void;
}

function patch<K extends keyof Resume>(
	setResume: FormProps["setResume"],
	key: K,
	value: Resume[K],
) {
	setResume((current) => ({ ...current, [key]: value }));
}

export function BasicsForm({ resume, setResume }: FormProps) {
	const basics = resume.basics;
	const update = (partial: Partial<Resume["basics"]>) =>
		setResume((current) => ({ ...current, basics: { ...current.basics, ...partial } }));

	return (
		<div className="grid gap-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="姓名">
					<Input value={basics.name} onChange={(e) => update({ name: e.target.value })} />
				</Field>
				<Field label="职位 / 头衔">
					<Input value={basics.label} onChange={(e) => update({ label: e.target.value })} />
				</Field>
				<Field label="邮箱">
					<Input value={basics.email ?? ""} onChange={(e) => update({ email: e.target.value })} />
				</Field>
				<Field label="电话">
					<Input value={basics.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} />
				</Field>
				<Field label="城市">
					<Input value={basics.location ?? ""} onChange={(e) => update({ location: e.target.value })} />
				</Field>
				<Field label="个人站点">
					<Input value={basics.url ?? ""} onChange={(e) => update({ url: e.target.value })} />
				</Field>
			</div>
			<Field label="简介（可选，显示在页头下方）">
				<Textarea
					value={basics.summary ?? ""}
					onChange={(e) => update({ summary: e.target.value })}
					rows={3}
				/>
			</Field>
			<Field label="照片（可选，写入简历 JSON）">
				<Input
					type="file"
					accept="image/*"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (!file) return;
						const reader = new FileReader();
						reader.onload = () => update({ photo: String(reader.result) });
						reader.readAsDataURL(file);
					}}
				/>
			</Field>
		</div>
	);
}

export function SkillsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.skills.map((skill, index) => (
				<div key={skill.id} className="rounded-xl border border-black/8 bg-white p-3">
					<div className="mb-2 flex justify-end">
						<ListControls
							index={index}
							total={resume.skills.length}
							onMove={(from, to) => patch(setResume, "skills", moveItem(resume.skills, from, to))}
							onRemove={() =>
								patch(
									setResume,
									"skills",
									resume.skills.filter((item) => item.id !== skill.id),
								)
							}
						/>
					</div>
					<div className="grid gap-3">
						<Field label="类别">
							<Input
								value={skill.name}
								onChange={(e) =>
									patch(
										setResume,
										"skills",
										resume.skills.map((item) =>
											item.id === skill.id ? { ...item, name: e.target.value } : item,
										),
									)
								}
							/>
						</Field>
						<Field label="内容">
							<Input
								value={skill.keywords}
								onChange={(e) =>
									patch(
										setResume,
										"skills",
										resume.skills.map((item) =>
											item.id === skill.id ? { ...item, keywords: e.target.value } : item,
										),
									)
								}
							/>
						</Field>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "skills", [
						...resume.skills,
						{ id: uid("skill"), name: "", keywords: "" },
					])
				}
			>
				<Plus /> 添加技能类别
			</Button>
		</div>
	);
}

export function ExperienceForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.experience.map((item, index) => (
				<div key={item.id} className="rounded-xl border border-black/8 bg-white p-3">
					<div className="mb-2 flex justify-end">
						<ListControls
							index={index}
							total={resume.experience.length}
							onMove={(from, to) =>
								patch(setResume, "experience", moveItem(resume.experience, from, to))
							}
							onRemove={() =>
								patch(
									setResume,
									"experience",
									resume.experience.filter((row) => row.id !== item.id),
								)
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Field label="公司 / 组织">
							<Input
								value={item.company}
								onChange={(e) =>
									patch(
										setResume,
										"experience",
										resume.experience.map((row) =>
											row.id === item.id ? { ...row, company: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="职位">
							<Input
								value={item.position}
								onChange={(e) =>
									patch(
										setResume,
										"experience",
										resume.experience.map((row) =>
											row.id === item.id ? { ...row, position: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="开始">
							<Input
								value={item.startDate}
								onChange={(e) =>
									patch(
										setResume,
										"experience",
										resume.experience.map((row) =>
											row.id === item.id ? { ...row, startDate: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="结束">
							<Input
								value={item.endDate}
								onChange={(e) =>
									patch(
										setResume,
										"experience",
										resume.experience.map((row) =>
											row.id === item.id ? { ...row, endDate: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
					</div>
					<div className="mt-3">
						<HighlightsEditor
							value={item.highlights}
							onChange={(highlights) =>
								patch(
									setResume,
									"experience",
									resume.experience.map((row) =>
										row.id === item.id ? { ...row, highlights } : row,
									),
								)
							}
						/>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "experience", [
						...resume.experience,
						{
							id: uid("exp"),
							company: "",
							position: "",
							startDate: "",
							endDate: "",
							highlights: [""],
						},
					])
				}
			>
				<Plus /> 添加工作 / 实习
			</Button>
		</div>
	);
}

export function ProjectsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.projects.map((item, index) => (
				<div key={item.id} className="rounded-xl border border-black/8 bg-white p-3">
					<div className="mb-2 flex justify-end">
						<ListControls
							index={index}
							total={resume.projects.length}
							onMove={(from, to) => patch(setResume, "projects", moveItem(resume.projects, from, to))}
							onRemove={() =>
								patch(
									setResume,
									"projects",
									resume.projects.filter((row) => row.id !== item.id),
								)
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Field label="项目名称">
							<Input
								value={item.name}
								onChange={(e) =>
									patch(
										setResume,
										"projects",
										resume.projects.map((row) =>
											row.id === item.id ? { ...row, name: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="角色">
							<Input
								value={item.role ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"projects",
										resume.projects.map((row) =>
											row.id === item.id ? { ...row, role: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="开始">
							<Input
								value={item.startDate ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"projects",
										resume.projects.map((row) =>
											row.id === item.id ? { ...row, startDate: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="结束">
							<Input
								value={item.endDate ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"projects",
										resume.projects.map((row) =>
											row.id === item.id ? { ...row, endDate: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
					</div>
					<div className="mt-3">
						<HighlightsEditor
							value={item.highlights}
							onChange={(highlights) =>
								patch(
									setResume,
									"projects",
									resume.projects.map((row) => (row.id === item.id ? { ...row, highlights } : row)),
								)
							}
						/>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "projects", [
						...resume.projects,
						{ id: uid("proj"), name: "", role: "", highlights: [""] },
					])
				}
			>
				<Plus /> 添加项目
			</Button>
		</div>
	);
}

export function EducationForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.education.map((item, index) => (
				<div key={item.id} className="rounded-xl border border-black/8 bg-white p-3">
					<div className="mb-2 flex justify-end">
						<ListControls
							index={index}
							total={resume.education.length}
							onMove={(from, to) =>
								patch(setResume, "education", moveItem(resume.education, from, to))
							}
							onRemove={() =>
								patch(
									setResume,
									"education",
									resume.education.filter((row) => row.id !== item.id),
								)
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Field label="学校">
							<Input
								value={item.institution}
								onChange={(e) =>
									patch(
										setResume,
										"education",
										resume.education.map((row) =>
											row.id === item.id ? { ...row, institution: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="学历">
							<Input
								value={item.studyType ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"education",
										resume.education.map((row) =>
											row.id === item.id ? { ...row, studyType: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="专业">
							<Input
								value={item.area ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"education",
										resume.education.map((row) =>
											row.id === item.id ? { ...row, area: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="地点">
							<Input
								value={item.location ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"education",
										resume.education.map((row) =>
											row.id === item.id ? { ...row, location: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="开始">
							<Input
								value={item.startDate}
								onChange={(e) =>
									patch(
										setResume,
										"education",
										resume.education.map((row) =>
											row.id === item.id ? { ...row, startDate: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="结束">
							<Input
								value={item.endDate}
								onChange={(e) =>
									patch(
										setResume,
										"education",
										resume.education.map((row) =>
											row.id === item.id ? { ...row, endDate: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
					</div>
					<div className="mt-3">
						<HighlightsEditor
							value={item.highlights}
							onChange={(highlights) =>
								patch(
									setResume,
									"education",
									resume.education.map((row) =>
										row.id === item.id ? { ...row, highlights } : row,
									),
								)
							}
						/>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "education", [
						...resume.education,
						{
							id: uid("edu"),
							institution: "",
							studyType: "",
							area: "",
							startDate: "",
							endDate: "",
							highlights: [],
						},
					])
				}
			>
				<Plus /> 添加教育经历
			</Button>
		</div>
	);
}

export function AwardsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.awards.map((item, index) => (
				<div key={item.id} className="rounded-xl border border-black/8 bg-white p-3">
					<div className="mb-2 flex justify-end">
						<ListControls
							index={index}
							total={resume.awards.length}
							onMove={(from, to) => patch(setResume, "awards", moveItem(resume.awards, from, to))}
							onRemove={() =>
								patch(
									setResume,
									"awards",
									resume.awards.filter((row) => row.id !== item.id),
								)
							}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<Field label="奖项">
							<Input
								value={item.title}
								onChange={(e) =>
									patch(
										setResume,
										"awards",
										resume.awards.map((row) =>
											row.id === item.id ? { ...row, title: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="年份">
							<Input
								value={item.date ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"awards",
										resume.awards.map((row) =>
											row.id === item.id ? { ...row, date: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="颁发机构">
							<Input
								value={item.awarder ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"awards",
										resume.awards.map((row) =>
											row.id === item.id ? { ...row, awarder: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "awards", [
						...resume.awards,
						{ id: uid("award"), title: "", date: "" },
					])
				}
			>
				<Plus /> 添加获奖
			</Button>
		</div>
	);
}

export function PublicationsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.publications.map((item, index) => (
				<div key={item.id} className="rounded-xl border border-black/8 bg-white p-3">
					<div className="mb-2 flex justify-end">
						<ListControls
							index={index}
							total={resume.publications.length}
							onMove={(from, to) =>
								patch(setResume, "publications", moveItem(resume.publications, from, to))
							}
							onRemove={() =>
								patch(
									setResume,
									"publications",
									resume.publications.filter((row) => row.id !== item.id),
								)
							}
						/>
					</div>
					<div className="grid gap-3">
						<Field label="标题">
							<Input
								value={item.name}
								onChange={(e) =>
									patch(
										setResume,
										"publications",
										resume.publications.map((row) =>
											row.id === item.id ? { ...row, name: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<Field label="作者 / 摘要行">
							<Input
								value={item.summary ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"publications",
										resume.publications.map((row) =>
											row.id === item.id ? { ...row, summary: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<div className="grid grid-cols-2 gap-3">
							<Field label="出版方">
								<Input
									value={item.publisher ?? ""}
									onChange={(e) =>
										patch(
											setResume,
											"publications",
											resume.publications.map((row) =>
												row.id === item.id ? { ...row, publisher: e.target.value } : row,
											),
										)
									}
								/>
							</Field>
							<Field label="年份">
								<Input
									value={item.releaseDate ?? ""}
									onChange={(e) =>
										patch(
											setResume,
											"publications",
											resume.publications.map((row) =>
												row.id === item.id ? { ...row, releaseDate: e.target.value } : row,
											),
										)
									}
								/>
							</Field>
						</div>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "publications", [
						...resume.publications,
						{ id: uid("pub"), name: "" },
					])
				}
			>
				<Plus /> 添加论文
			</Button>
		</div>
	);
}

export function LanguagesForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.languages.map((item, index) => (
				<div key={item.id} className="flex items-end gap-2 rounded-xl border border-black/8 bg-white p-3">
					<Field label="语言">
						<Input
							value={item.language}
							onChange={(e) =>
								patch(
									setResume,
									"languages",
									resume.languages.map((row) =>
										row.id === item.id ? { ...row, language: e.target.value } : row,
									),
								)
							}
						/>
					</Field>
					<Field label="水平 / 成绩">
						<Input
							value={item.fluency ?? ""}
							onChange={(e) =>
								patch(
									setResume,
									"languages",
									resume.languages.map((row) =>
										row.id === item.id ? { ...row, fluency: e.target.value } : row,
									),
								)
							}
						/>
					</Field>
					<ListControls
						index={index}
						total={resume.languages.length}
						onMove={(from, to) =>
							patch(setResume, "languages", moveItem(resume.languages, from, to))
						}
						onRemove={() =>
							patch(
								setResume,
								"languages",
								resume.languages.filter((row) => row.id !== item.id),
							)
						}
					/>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "languages", [
						...resume.languages,
						{ id: uid("lang"), language: "", fluency: "" },
					])
				}
			>
				<Plus /> 添加语言
			</Button>
		</div>
	);
}

export function CustomSectionsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-4">
			{resume.customSections.map((section, sectionIndex) => (
				<div key={section.id} className="rounded-xl border border-black/8 bg-white p-3">
					<div className="mb-2 flex items-center justify-between gap-2">
						<Field label="区块标题">
							<Input
								value={section.title}
								onChange={(e) =>
									patch(
										setResume,
										"customSections",
										resume.customSections.map((row) =>
											row.id === section.id ? { ...row, title: e.target.value } : row,
										),
									)
								}
							/>
						</Field>
						<ListControls
							index={sectionIndex}
							total={resume.customSections.length}
							onMove={(from, to) =>
								patch(setResume, "customSections", moveItem(resume.customSections, from, to))
							}
							onRemove={() =>
								patch(
									setResume,
									"customSections",
									resume.customSections.filter((row) => row.id !== section.id),
								)
							}
						/>
					</div>
					<div className="grid gap-3">
						{section.items.map((item, itemIndex) => (
							<div key={item.id} className="rounded-md border border-dashed p-3">
								<div className="mb-2 flex justify-end">
									<ListControls
										index={itemIndex}
										total={section.items.length}
										onMove={(from, to) =>
											patch(
												setResume,
												"customSections",
												resume.customSections.map((row) =>
													row.id === section.id
														? { ...row, items: moveItem(row.items, from, to) }
														: row,
												),
											)
										}
										onRemove={() =>
											patch(
												setResume,
												"customSections",
												resume.customSections.map((row) =>
													row.id === section.id
														? { ...row, items: row.items.filter((entry) => entry.id !== item.id) }
														: row,
												),
											)
										}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<Field label="标题">
										<Input
											value={item.title}
											onChange={(e) =>
												patch(
													setResume,
													"customSections",
													resume.customSections.map((row) =>
														row.id === section.id
															? {
																	...row,
																	items: row.items.map((entry) =>
																		entry.id === item.id
																			? { ...entry, title: e.target.value }
																			: entry,
																	),
																}
															: row,
													),
												)
											}
										/>
									</Field>
									<Field label="副标题">
										<Input
											value={item.subtitle ?? ""}
											onChange={(e) =>
												patch(
													setResume,
													"customSections",
													resume.customSections.map((row) =>
														row.id === section.id
															? {
																	...row,
																	items: row.items.map((entry) =>
																		entry.id === item.id
																			? { ...entry, subtitle: e.target.value }
																			: entry,
																	),
																}
															: row,
													),
												)
											}
										/>
									</Field>
								</div>
								<div className="mt-3">
									<HighlightsEditor
										value={item.highlights}
										onChange={(highlights) =>
											patch(
												setResume,
												"customSections",
												resume.customSections.map((row) =>
													row.id === section.id
														? {
																...row,
																items: row.items.map((entry) =>
																	entry.id === item.id ? { ...entry, highlights } : entry,
																),
															}
														: row,
												),
											)
										}
									/>
								</div>
							</div>
						))}
						<Button
							type="button"
							variant="secondary"
							onClick={() =>
								patch(
									setResume,
									"customSections",
									resume.customSections.map((row) =>
										row.id === section.id
											? {
													...row,
													items: [
														...row.items,
														{ id: uid("centry"), title: "", highlights: [""] },
													],
												}
											: row,
									),
								)
							}
						>
							<Plus /> 添加条目
						</Button>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "customSections", [
						...resume.customSections,
						{ id: uid("sec"), title: "自定义区块", items: [] },
					])
				}
			>
				<Plus /> 添加自定义区块
			</Button>
		</div>
	);
}

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
				<p className="mb-2 text-sm font-medium text-neutral-700">纸张排版</p>
				<div className="grid grid-cols-2 gap-2">
					{(
						[
							{ id: "single", title: "长图", hint: "整份渲成一张图，高度随内容变化，适合分享预览" },
							{ id: "multi", title: "A4", hint: "分页高保真文字稿，适合打印和投递" },
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
								"pressable rounded-xl border px-3 py-3 text-left transition-colors duration-100",
								layoutMode === option.id
									? "border-neutral-900 bg-neutral-900 text-white"
									: "border-black/10 bg-white text-neutral-700 hover:bg-neutral-50",
							)}
						>
							<p className="text-sm font-medium">{option.title}</p>
							<p className={cn("mt-1 text-xs leading-relaxed", layoutMode === option.id ? "text-white/70" : "text-neutral-500")}>
								{option.hint}
							</p>
						</button>
					))}
				</div>
			</div>
			<Field label={`字号基准 ${meta.fontScale.toFixed(2)}`}>
				<input
					type="range"
					min={0.85}
					max={1.15}
					step={0.01}
					value={meta.fontScale}
					onChange={(e) =>
						setResume((current) => ({
							...current,
							meta: { ...current.meta, fontScale: Number(e.target.value) },
						}))
					}
				/>
			</Field>
			<label className="flex items-center justify-between gap-3 text-sm">
				<span className="font-medium text-neutral-700">显示照片</span>
				<Switch
					checked={meta.showPhoto}
					onCheckedChange={(checked) =>
						setResume((current) => ({
							...current,
							meta: { ...current.meta, showPhoto: checked },
						}))
					}
				/>
			</label>
			<div>
				<p className="mb-2 text-sm font-medium text-neutral-700">栏目顺序</p>
				<div className="grid gap-2">
					{meta.sectionOrder.map((key, index) => (
						<div key={key} className="flex items-center justify-between rounded-xl border border-black/8 bg-white px-3 py-1.5">
							<span className="text-sm">{SECTION_LABELS[key] ?? key}</span>
							<ListControls
								index={index}
								total={meta.sectionOrder.length}
								onMove={(from, to) =>
									setResume((current) => ({
										...current,
										meta: {
											...current.meta,
											sectionOrder: moveItem(current.meta.sectionOrder, from, to),
										},
									}))
								}
								onRemove={() => undefined}
							/>
						</div>
					))}
				</div>
				<p className="mt-2 text-xs text-muted-foreground">空栏目不会出现在简历上。此处不可删除栏目，以免打乱模板。</p>
			</div>
		</div>
	);
}
