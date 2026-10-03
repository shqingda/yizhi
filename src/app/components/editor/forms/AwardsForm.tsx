import { Plus } from "lucide-react";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryCard, Field, ListControls, moveItem } from "../ListControls";
import { type FormProps, patch } from "./shared";

export function AwardsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{!resume.awards.length && (
				<p className="text-sm leading-6 text-muted-foreground">
					添加与目标职位相关的奖项，注明颁发机构和年份。
				</p>
			)}
			{resume.awards.map((item, index) => (
				<EntryCard
					key={item.id}
					title={item.title}
					onCopy={() =>
						patch(setResume, "awards", [
							...resume.awards.slice(0, index + 1),
							{ ...structuredClone(item), id: uid("copy") },
							...resume.awards.slice(index + 1),
						])
					}
				>
					<div className="mb-2 flex justify-end">
						<ListControls
 label={item.title || `奖项 ${index + 1}`}
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
					<div className="editor-field-grid grid grid-cols-2 gap-3">
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
										resume.awards.map((row) => (row.id === item.id ? { ...row, date: e.target.value } : row)),
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
				</EntryCard>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "awards", [...resume.awards, { id: uid("award"), title: "", date: "" }])
				}
			>
				<Plus data-icon="inline-start" /> 添加获奖
			</Button>
		</div>
	);
}
