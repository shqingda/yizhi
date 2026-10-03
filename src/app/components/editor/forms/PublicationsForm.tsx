import { Plus } from "lucide-react";
import { uid } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntryCard, Field, ListControls, moveItem } from "../ListControls";
import { type FormProps, patch } from "./shared";

export function PublicationsForm({ resume, setResume }: FormProps) {
	return (
		<div className="grid gap-3">
			{!resume.publications.length && (
				<p className="text-sm leading-6 text-muted-foreground">填写论文或作品名称，可补充发表平台与链接。</p>
			)}
			{resume.publications.map((item, index) => (
				<EntryCard
					key={item.id}
					title={item.name}
					onCopy={() =>
						patch(setResume, "publications", [
							...resume.publications.slice(0, index + 1),
							{ ...structuredClone(item), id: uid("copy") },
							...resume.publications.slice(index + 1),
						])
					}
				>
					<div className="mb-2 flex justify-end">
						<ListControls
 label={item.name || `论文 ${index + 1}`}
							index={index}
							total={resume.publications.length}
							onMove={(from, to) => patch(setResume, "publications", moveItem(resume.publications, from, to))}
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
						<div className="editor-field-grid grid grid-cols-2 gap-3">
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
				</EntryCard>
			))}
			<Button
				type="button"
				variant="outline"
				onClick={() =>
					patch(setResume, "publications", [...resume.publications, { id: uid("pub"), name: "" }])
				}
			>
				<Plus data-icon="inline-start" /> 添加论文
			</Button>
		</div>
	);
}
