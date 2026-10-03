import { Plus } from "lucide-react";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryCard, Field, HighlightsEditor, ListControls, moveItem } from "../ListControls";
import { DateInput } from "../DateInput";
import { type FormProps, patch } from "./shared";

export function ExperienceForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{!resume.experience.length && (
				<p className="text-sm leading-6 text-muted-foreground">
					先添加最近一份工作或实习。每条要点写清行动、方法和结果。
				</p>
			)}
			{resume.experience.map((item, index) => (
				<EntryCard
					key={item.id}
					title={[item.company, item.position, item.startDate, item.endDate].filter(Boolean).join(" · ")}
					onCopy={() =>
						patch(setResume, "experience", [
							...resume.experience.slice(0, index + 1),
							{ ...structuredClone(item), id: uid("copy") },
							...resume.experience.slice(index + 1),
						])
					}
				>
					<div className="mb-2 flex justify-end">
						<ListControls
 label={item.company || `工作经历 ${index + 1}`}
							index={index}
							total={resume.experience.length}
							onMove={(from, to) => patch(setResume, "experience", moveItem(resume.experience, from, to))}
							onRemove={() =>
								patch(
									setResume,
									"experience",
									resume.experience.filter((row) => row.id !== item.id),
								)
							}
						/>
					</div>
					<div className="editor-field-grid grid grid-cols-2 gap-3">
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
							<DateInput
								value={item.startDate}
								onChange={(value) =>
									patch(
										setResume,
										"experience",
										resume.experience.map((row) => (row.id === item.id ? { ...row, startDate: value } : row)),
									)
								}
							/>
						</Field>
						<Field label="结束">
							<DateInput
								end
								start={item.startDate}
								value={item.endDate}
								onChange={(value) =>
									patch(
										setResume,
										"experience",
										resume.experience.map((row) => (row.id === item.id ? { ...row, endDate: value } : row)),
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
									resume.experience.map((row) => (row.id === item.id ? { ...row, highlights } : row)),
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
