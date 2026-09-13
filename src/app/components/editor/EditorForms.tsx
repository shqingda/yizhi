import {
	Cake,
	Link2,
	Mail,
	MapPin,
	Phone,
	Plus,
	Trash2,
	UserRound,
} from "lucide-react";
import type { ContactFieldKey, HeaderAlign, Resume, SectionKey } from "@shared/schema";
import { toggleHidden, uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, HighlightsEditor, IconButton, ListControls, VisibilityToggle, moveItem } from "./ListControls";
import { SortableList } from "./SortableList";

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

const CONTACT_FIELDS: {
	id: ContactFieldKey;
	label: string;
	placeholder: string;
	icon: typeof Mail;
}[] = [
	{ id: "email", label: "邮箱", placeholder: "name@email.com", icon: Mail },
	{ id: "phone", label: "电话", placeholder: "手机号", icon: Phone },
	{ id: "location", label: "地址", placeholder: "城市 / 地区", icon: MapPin },
	{ id: "url", label: "站点", placeholder: "https://", icon: Link2 },
	{ id: "birthday", label: "生日", placeholder: "1996/01", icon: Cake },
	{ id: "status", label: "状态", placeholder: "在职 / 离职 / 求职中", icon: UserRound },
];

function patchMeta(setResume: FormProps["setResume"], partial: Partial<Resume["meta"]>) {
	setResume((current) => ({ ...current, meta: { ...current.meta, ...partial } }));
}

export function BasicsForm({ resume, setResume }: FormProps) {
	const basics = resume.basics;
	const meta = resume.meta;
	const hidden = new Set(meta.hiddenBasics);
	const update = (partial: Partial<Resume["basics"]>) =>
		setResume((current) => ({ ...current, basics: { ...current.basics, ...partial } }));
	const toggleField = (key: Resume["meta"]["hiddenBasics"][number]) =>
		patchMeta(setResume, { hiddenBasics: toggleHidden(meta.hiddenBasics, key) });

	return (
		<div className="grid gap-5">
			<div>
				<p className="mb-2 text-sm font-medium text-neutral-700">布局</p>
				<div className="grid grid-cols-3 gap-2">
					{(
						[
							{ id: "left", label: "居左" },
							{ id: "center", label: "居中" },
							{ id: "right", label: "居右" },
						] as const
					).map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() => patchMeta(setResume, { headerAlign: option.id })}
							className={cn(
								"pressable flex flex-col items-stretch gap-1.5 rounded-xl border px-2 py-2 transition-colors duration-100",
								meta.headerAlign === option.id
									? "border-neutral-900 bg-neutral-900 text-white"
									: "border-black/10 bg-white text-neutral-600 hover:bg-neutral-50",
							)}
						>
							<AlignMark align={option.id} />
							<span className="text-center text-[11px]">{option.label}</span>
						</button>
					))}
				</div>
			</div>

			<div>
				<p className="mb-2 text-sm font-medium text-neutral-700">资料</p>
				<div className="flex items-center gap-2">
					{basics.photo ? (
						<img
							src={basics.photo}
							alt=""
							className="size-10 shrink-0 rounded-md object-contain bg-neutral-100"
						/>
					) : null}
					<Input
						type="file"
						accept="image/*"
						className="min-w-0 flex-1"
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (!file) return;
							const reader = new FileReader();
							reader.onload = () => update({ photo: String(reader.result) });
							reader.readAsDataURL(file);
						}}
					/>
					<VisibilityToggle
						visible={meta.showPhoto}
						onToggle={() => patchMeta(setResume, { showPhoto: !meta.showPhoto })}
					/>
				</div>
			</div>

			<div>
				<p className="mb-2 text-sm font-medium text-neutral-700">基础字段</p>
				<div className="grid gap-2">
					<BasicsFieldRow
						label="姓名"
						value={basics.name}
						visible={!hidden.has("name")}
						onChange={(name) => update({ name })}
						onToggle={() => toggleField("name")}
					/>
					<BasicsFieldRow
						label="职位"
						value={basics.label}
						visible={!hidden.has("label")}
						onChange={(label) => update({ label })}
						onToggle={() => toggleField("label")}
					/>
				</div>
			</div>

			<div>
				<p className="mb-2 text-sm font-medium text-neutral-700">联系信息</p>
				<SortableList
					items={meta.basicsOrder}
					getId={(key) => key}
					onReorder={(basicsOrder) => patchMeta(setResume, { basicsOrder })}
				>
					{(key, { handle, dragging }) => {
						const field = CONTACT_FIELDS.find((item) => item.id === key) ?? CONTACT_FIELDS[0];
						const Icon = field.icon;
						const visible = !hidden.has(key);
						return (
							<div
								className={cn(
									"flex items-center gap-1.5 rounded-xl border border-black/8 bg-white px-1.5 py-1",
									dragging && "shadow-md",
									!visible && "opacity-45",
								)}
							>
								{handle}
								<Icon className="size-3.5 shrink-0 text-neutral-400" />
								<span className="w-10 shrink-0 text-xs text-neutral-500">{field.label}</span>
								<Input
									className="h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
									value={basics[key] ?? ""}
									placeholder={field.placeholder}
									onChange={(e) => update({ [key]: e.target.value })}
								/>
								<VisibilityToggle visible={visible} onToggle={() => toggleField(key)} />
							</div>
						);
					}}
				</SortableList>
				<p className="mt-2 text-xs text-muted-foreground">按住左侧拖动排序，点眼睛隐藏或显示。空字段即使开启也不会印在简历上。</p>
			</div>

			<Field label="简介">
				<Textarea
					value={basics.summary ?? ""}
					onChange={(e) => update({ summary: e.target.value })}
					rows={3}
					placeholder="可选，显示在页头下方"
				/>
			</Field>
		</div>
	);
}

function AlignMark({ align }: { align: HeaderAlign }) {
	return (
		<span className="flex h-7 items-center px-2">
			<span
				className={cn(
					"h-1.5 w-7 rounded-full bg-current",
					align === "left" && "mr-auto",
					align === "center" && "mx-auto",
					align === "right" && "ml-auto",
				)}
			/>
		</span>
	);
}

function BasicsFieldRow({
	label,
	value,
	visible,
	onChange,
	onToggle,
}: {
	label: string;
	value: string;
	visible: boolean;
	onChange: (value: string) => void;
	onToggle: () => void;
}) {
	return (
		<div className={cn("flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3 py-1", !visible && "opacity-45")}>
			<span className="w-10 shrink-0 text-xs text-neutral-500">{label}</span>
			<Input
				className="h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			<VisibilityToggle visible={visible} onToggle={onToggle} />
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
				<Plus data-icon="inline-start" /> 添加技能类别
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
				<Plus data-icon="inline-start" /> 添加工作 / 实习
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
						<Field label="链接">
							<Input
								value={item.url ?? ""}
								onChange={(e) =>
									patch(
										setResume,
										"projects",
										resume.projects.map((row) =>
											row.id === item.id ? { ...row, url: e.target.value } : row,
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
				<Plus data-icon="inline-start" /> 添加项目
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
				<Plus data-icon="inline-start" /> 添加教育经历
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
				<Plus data-icon="inline-start" /> 添加获奖
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
				<Plus data-icon="inline-start" /> 添加论文
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
				<Plus data-icon="inline-start" /> 添加语言
			</Button>
		</div>
	);
}

function updateCustomSection(
	setResume: FormProps["setResume"],
	resume: Resume,
	sectionId: string,
	updater: (section: Resume["customSections"][number]) => Resume["customSections"][number],
) {
	patch(
		setResume,
		"customSections",
		resume.customSections.map((row) => (row.id === sectionId ? updater(row) : row)),
	);
}

export function CustomSectionsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{resume.customSections.map((section) => (
				<div key={section.id} className="rounded-xl border border-black/8 bg-white p-3">
					<p className="mb-1.5 text-sm font-medium text-neutral-700">区块标题</p>
					<div className="flex items-center gap-2">
						<Input
							className="min-w-0 flex-1"
							value={section.title}
							placeholder="自定义区块"
							onChange={(e) =>
								updateCustomSection(setResume, resume, section.id, (row) => ({
									...row,
									title: e.target.value,
								}))
							}
						/>
						<IconButton
							label="删除区块"
							onClick={() =>
								patch(
									setResume,
									"customSections",
									resume.customSections.filter((row) => row.id !== section.id),
								)
							}
						>
							<Trash2 className="size-4" />
						</IconButton>
					</div>
					<div className="mt-3 grid gap-2">
						{section.items.map((item) => (
							<div key={item.id} className="rounded-lg bg-neutral-50 p-2.5">
								<div className="flex items-center gap-2">
									<Input
										className="min-w-0 flex-1 bg-white"
										value={item.title}
										placeholder="标题"
										onChange={(e) =>
											updateCustomSection(setResume, resume, section.id, (row) => ({
												...row,
												items: row.items.map((entry) =>
													entry.id === item.id ? { ...entry, title: e.target.value } : entry,
												),
											}))
										}
									/>
									<IconButton
										label="删除条目"
										onClick={() =>
											updateCustomSection(setResume, resume, section.id, (row) => ({
												...row,
												items: row.items.filter((entry) => entry.id !== item.id),
											}))
										}
									>
										<Trash2 className="size-4" />
									</IconButton>
								</div>
								<div className="mt-2 grid grid-cols-2 gap-2">
									<Input
										className="bg-white"
										value={item.subtitle ?? ""}
										placeholder="副标题"
										onChange={(e) =>
											updateCustomSection(setResume, resume, section.id, (row) => ({
												...row,
												items: row.items.map((entry) =>
													entry.id === item.id ? { ...entry, subtitle: e.target.value } : entry,
												),
											}))
										}
									/>
									<Input
										className="bg-white"
										value={item.date ?? ""}
										placeholder="时间"
										onChange={(e) =>
											updateCustomSection(setResume, resume, section.id, (row) => ({
												...row,
												items: row.items.map((entry) =>
													entry.id === item.id ? { ...entry, date: e.target.value } : entry,
												),
											}))
										}
									/>
								</div>
								<div className="mt-2">
									<HighlightsEditor
										value={item.highlights}
										onChange={(highlights) =>
											updateCustomSection(setResume, resume, section.id, (row) => ({
												...row,
												items: row.items.map((entry) =>
													entry.id === item.id ? { ...entry, highlights } : entry,
												),
											}))
										}
									/>
								</div>
							</div>
						))}
						<Button
							type="button"
							variant="secondary"
							className="w-full"
							onClick={() =>
								updateCustomSection(setResume, resume, section.id, (row) => ({
									...row,
									items: [...row.items, { id: uid("centry"), title: "", highlights: [""] }],
								}))
							}
						>
							<Plus data-icon="inline-start" /> 添加条目
						</Button>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				className="w-full"
				onClick={() =>
					patch(setResume, "customSections", [
						...resume.customSections,
						{ id: uid("sec"), title: "自定义区块", items: [] },
					])
				}
			>
				<Plus data-icon="inline-start" /> 添加自定义区块
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
					onChange={(e) => patchMeta(setResume, { fontScale: Number(e.target.value) })}
				/>
			</Field>
			<div>
				<p className="mb-2 text-sm font-medium text-neutral-700">栏目顺序</p>
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
									"flex items-center gap-1.5 rounded-xl border border-black/8 bg-white px-1.5 py-1",
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
