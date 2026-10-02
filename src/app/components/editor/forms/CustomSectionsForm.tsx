import { Plus, Trash2 } from "lucide-react";
import { uid, type Resume } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HighlightsEditor, IconButton } from "../ListControls";
import { type FormProps, patch } from "./shared";

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
				<div key={section.id} className="rounded-xl border border-black/8 bg-card p-3">
					<p className="mb-1.5 text-sm font-medium text-foreground">区块标题</p>
					<div className="flex items-center gap-2">
						<Input
							className="min-w-0 flex-1"
							value={section.title}
							aria-label="自定义区块名称"
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
							<div key={item.id} className="rounded-lg bg-muted p-2.5">
								<div className="flex items-center gap-2">
									<Input
										className="min-w-0 flex-1 bg-card"
										value={item.title}
										aria-label="自定义条目标题"
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
								<div className="editor-field-grid mt-2 grid grid-cols-2 gap-2">
									<Input
										className="bg-card"
										value={item.subtitle ?? ""}
										aria-label="自定义条目副标题"
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
										className="bg-card"
										value={item.date ?? ""}
										aria-label="自定义条目时间"
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
