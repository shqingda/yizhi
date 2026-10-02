import { Plus } from "lucide-react";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryCard, Field, ListControls, moveItem } from "../ListControls";
import { type FormProps, patch } from "./shared";

export function LanguagesForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{!resume.languages.length && (
				<p className="text-sm leading-6 text-muted-foreground">
					写明语言及熟练程度，例如英语、工作交流或考试成绩。
				</p>
			)}
			{resume.languages.map((item, index) => (
				<EntryCard
					key={item.id}
					title={item.language}
					onCopy={() =>
						patch(setResume, "languages", [
							...resume.languages.slice(0, index + 1),
							{ ...structuredClone(item), id: uid("copy") },
							...resume.languages.slice(index + 1),
						])
					}
				>
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
						onMove={(from, to) => patch(setResume, "languages", moveItem(resume.languages, from, to))}
						onRemove={() =>
							patch(
								setResume,
								"languages",
								resume.languages.filter((row) => row.id !== item.id),
							)
						}
					/>
				</EntryCard>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "languages", [...resume.languages, { id: uid("lang"), language: "", fluency: "" }])
				}
			>
				<Plus data-icon="inline-start" /> 添加语言
			</Button>
		</div>
	);
}
