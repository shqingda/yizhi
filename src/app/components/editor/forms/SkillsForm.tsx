import { Plus } from "lucide-react";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryCard, Field, ListControls, moveItem } from "../ListControls";
import { type FormProps, patch } from "./shared";

export function SkillsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{!resume.skills.length && (
				<p className="text-sm leading-6 text-muted-foreground">
					按领域组织技能，例如编程语言、设计工具或专业能力。
				</p>
			)}
			{resume.skills.map((skill, index) => (
				<EntryCard
					key={skill.id}
					title={skill.name}
					onCopy={() =>
						patch(setResume, "skills", [
							...resume.skills.slice(0, index + 1),
							{ ...structuredClone(skill), id: uid("copy") },
							...resume.skills.slice(index + 1),
						])
					}
				>
					<div className="mb-2 flex justify-end">
						<ListControls
 label={skill.name || `技能 ${index + 1}`}
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
				</EntryCard>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "skills", [...resume.skills, { id: uid("skill"), name: "", keywords: "" }])
				}
			>
				<Plus data-icon="inline-start" /> 添加技能类别
			</Button>
		</div>
	);
}
