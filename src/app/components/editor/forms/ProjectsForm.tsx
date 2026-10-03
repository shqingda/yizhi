import { Plus } from "lucide-react";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryCard, Field, HighlightsEditor, ListControls, moveItem } from "../ListControls";
import { type FormProps, patch } from "./shared";

export function ProjectsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{!resume.projects.length && (
				<p className="text-sm leading-6 text-muted-foreground">
					选择与目标职位相关的项目，说明你的职责和贡献。
				</p>
			)}
			{resume.projects.map((item, index) => (
				<EntryCard
					key={item.id}
					title={item.name}
					onCopy={() =>
						patch(setResume, "projects", [
							...resume.projects.slice(0, index + 1),
							{ ...structuredClone(item), id: uid("copy") },
							...resume.projects.slice(index + 1),
						])
					}
				>
					<div className="mb-2 flex justify-end">
						<ListControls
 label={item.name || `项目经历 ${index + 1}`}
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
					<div className="editor-field-grid grid grid-cols-2 gap-3">
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
				</EntryCard>
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
