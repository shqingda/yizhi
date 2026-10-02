import { useState } from "react";
import { Cake, Link2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { type ContactFieldKey, type HeaderAlign, type Resume, toggleHidden } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, VisibilityToggle } from "../ListControls";
import { PhotoEditor } from "../PhotoEditor";
import { SortableList } from "../SortableList";
import { type FormProps, patchMeta } from "./shared";

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

export function BasicsForm({ resume, setResume }: FormProps) {
	const [contactHint, setContactHint] = useState("");
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
				<p className="mb-2 text-sm font-medium text-foreground">布局</p>
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
							aria-pressed={meta.headerAlign === option.id}
							type="button"
							onClick={() => patchMeta(setResume, { headerAlign: option.id })}
							className={cn(
								"pressable flex flex-col items-stretch gap-1.5 rounded-xl border px-2 py-2 transition-colors duration-100",
								meta.headerAlign === option.id
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-card text-muted-foreground hover:bg-muted",
							)}
						>
							<AlignMark align={option.id} />
							<span className="text-center text-[11px]">{option.label}</span>
						</button>
					))}
				</div>
			</div>

			<div>
				<p className="mb-2 text-sm font-medium text-foreground">照片</p>
				<PhotoEditor
					photo={basics.photo}
					visible={meta.showPhoto}
					onVisibilityChange={(showPhoto) => patchMeta(setResume, { showPhoto })}
					onChange={(photo) =>
						setResume((current) => ({
							...current,
							basics: { ...current.basics, photo },
							meta: { ...current.meta, showPhoto: !!photo },
						}))
					}
				/>
			</div>

			<div>
				<p className="mb-2 text-sm font-medium text-foreground">基础字段</p>
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
				<p className="mb-2 text-sm font-medium text-foreground">联系信息</p>
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
									"flex items-center gap-1.5 rounded-xl border border-black/8 bg-card px-1.5 py-1",
									dragging && "shadow-md",
									!visible && "opacity-45",
								)}
							>
								{handle}
								<Icon className="size-3.5 shrink-0 text-muted-foreground" />
								<span className="w-10 shrink-0 text-xs text-muted-foreground">{field.label}</span>
								<Input
									className="h-8 min-w-0 flex-1 border-0 bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0"
									value={basics[key] ?? ""}
									aria-label={field.label}
									onBlur={(e) => {
										const value = e.target.value.trim();
										setContactHint(
											key === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
												? "邮箱格式可能不完整，请检查。"
												: key === "url" && value && !/^https?:\/\//i.test(value)
													? "站点建议填写完整的 https:// 地址。"
													: "",
										);
									}}
									type={key === "email" ? "email" : key === "phone" ? "tel" : key === "url" ? "url" : "text"}
									placeholder={field.placeholder}
									onChange={(e) => update({ [key]: e.target.value })}
								/>
								<VisibilityToggle visible={visible} onToggle={() => toggleField(key)} />
							</div>
						);
					}}
				</SortableList>
				<p role="status" className="text-xs text-amber-800 dark:text-amber-300">
					{contactHint}
				</p>
				<p className="mt-2 text-xs text-muted-foreground">
					按住左侧拖动排序，点眼睛隐藏或显示。空字段即使开启也不会印在简历上。
				</p>
			</div>

			<Field label="简介">
				<Textarea
					value={basics.summary ?? ""}
					onChange={(e) => update({ summary: e.target.value })}
					rows={3}
					placeholder="可选：用两三句话说明擅长的领域、主要经验和求职方向"
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
		<div
			className={cn(
				"flex items-center gap-2 rounded-xl border border-black/8 bg-card px-3 py-1",
				!visible && "opacity-45",
			)}
		>
			<span className="w-10 shrink-0 text-xs text-muted-foreground">{label}</span>
			<Input
				className="h-8 min-w-0 flex-1 border-0 bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0"
				aria-label={label}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			<VisibilityToggle visible={visible} onToggle={onToggle} />
		</div>
	);
}
