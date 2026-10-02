import { Plus } from "lucide-react";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryCard, Field, HighlightsEditor, ListControls, moveItem } from "../ListControls";
import { DateInput } from "../DateInput";
import { type FormProps, patch } from "./shared";

export function EducationForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{!resume.education.length && (
				<p className="text-sm leading-6 text-muted-foreground">
					从最近一段教育经历开始，可以补充相关课程或成绩。
				</p>
			)}
			{resume.education.map((item, index) => (
				<EntryCard
					key={item.id}
					title={[item.institution, item.area, item.startDate, item.endDate].filter(Boolean).join(" · ")}
					onCopy={() =>
						patch(setResume, "education", [
							...resume.education.slice(0, index + 1),
							{ ...structuredClone(item), id: uid("copy") },
							...resume.education.slice(index + 1),
						])
					}
				>
					<div className="mb-2 flex justify-end">
						<ListControls
							index={index}
							total={resume.education.length}
							onMove={(from, to) => patch(setResume, "education", moveItem(resume.education, from, to))}
							onRemove={() =>
								patch(
									setResume,
									"education",
									resume.education.filter((row) => row.id !== item.id),
								)
							}
						/>
					</div>
					<div className="editor-field-grid grid grid-cols-2 gap-3">
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
							<DateInput
								value={item.startDate}
								onChange={(value) =>
									patch(
										setResume,
										"education",
										resume.education.map((row) => (row.id === item.id ? { ...row, startDate: value } : row)),
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
										"education",
										resume.education.map((row) => (row.id === item.id ? { ...row, endDate: value } : row)),
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
									resume.education.map((row) => (row.id === item.id ? { ...row, highlights } : row)),
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
