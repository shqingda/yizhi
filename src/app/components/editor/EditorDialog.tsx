import { useState } from "react";
import { toast } from "sonner";
import type { Resume } from "@shared/schema";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { downloadJson } from "@/lib/resumeFiles";
import { removeWithFocus } from "@/lib/editorFocus";

export type EditorPanel = "import" | "export" | "recovery" | "manage" | "reset";
const stamp = (time: string) => new Date(time).toLocaleString("zh-CN", { hour12: false });

interface EditorDialogProps {
	panel: Exclude<EditorPanel, "export">;
	imported: Resume | null;
	onClose: () => void;
}

export function EditorDialog({
	panel,
	imported,
	onClose,
}: EditorDialogProps) {
	const model = useWorkspace();
	const [rename, setRename] = useState(() => model.drafts.find((d) => d.id === model.activeId)!.name);
	const [exporting, setExporting] = useState(false);

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !exporting) onClose();
			}}
		>
			<DialogContent className="max-h-[85dvh] overflow-auto sm:max-w-lg">
				<DialogTitle>
					{
						(
							{
								import: "从备份恢复",
								recovery: "恢复点",
								manage: "我的简历",
								reset: "恢复示例内容",
							} as const
						)[panel]
					}
				</DialogTitle>
				<DialogDescription>
					{panel === "import"
						? "确认后才替换当前内容，替换前会自动创建恢复点。"
						: panel === "recovery"
							? "每份简历保留最近 5 次重要操作前的内容，恢复前也会备份当前稿。"
							: panel === "reset"
									? "当前内容将替换为示例，替换前会创建恢复点。"
									: "简历保存在当前浏览器中，可通过 JSON 导出备份。"}
				</DialogDescription>
				{panel === "import" && imported && (
					<>
						<p>
							{imported.basics.name || "未填写姓名"} · 工作经历 {imported.experience.length} 条 · 项目{" "}
							{imported.projects.length} 条 · 教育 {imported.education.length} 条
						</p>
						<Button
							onClick={() => {
								if (model.replace(imported)) {
									onClose();
									toast.success("已恢复备份");
								}
							}}
						>
							确认替换
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								if (model.newDraft("blank", imported)) onClose();
							}}
						>
							另存为新简历
						</Button>
					</>
				)}
				{panel === "reset" && (
					<Button
						disabled={exporting}
						onClick={async () => {
							setExporting(true);
							try {
								if (await model.resetSample()) onClose();
							} finally {
								setExporting(false);
							}
						}}
					>
						确认恢复示例
					</Button>
				)}
				{panel === "recovery" && (
					<>
						{!model.backups.length && <p>还没有恢复点。导入或重置前会自动创建。</p>}
						{model.backups.map((b) => (
							<div key={b.id} data-editor-entry className="border-b pb-3">
								<p tabIndex={-1} data-entry-focus>
									{b.label} · {b.data.basics.name || "未填写姓名"}
								</p>
								<p className="my-2 text-xs text-muted-foreground">{stamp(b.time)}</p>
								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										aria-label={`恢复${b.label}，${stamp(b.time)}`}
										onClick={() => {
											if (model.restore(b.id)) {
												onClose();
												toast.success("已恢复，可继续撤销");
											}
										}}
									>
										恢复
									</Button>
									<Button
										size="sm"
										variant="outline"
										aria-label={`下载${b.label}，${stamp(b.time)}`}
										onClick={() => downloadJson(b.data, `恢复点-${b.time.slice(0, 10)}.json`)}
									>
										下载
									</Button>
									<Button size="sm" variant="ghost" aria-label={`删除恢复点${b.label}，${stamp(b.time)}`} onClick={event => removeWithFocus(event.currentTarget, () => model.removeBackup(b.id))}>
										删除恢复点
									</Button>
								</div>
							</div>
						))}
					</>
				)}
				{panel === "manage" && (
					<>
						<label className="grid gap-2">
							当前简历名称
							<Input value={rename} onChange={(e) => setRename(e.target.value)} maxLength={80} />
						</label>
						<Button
							variant="outline"
							onClick={() => {
								model.rename(rename);
								if (model.flushLocal()) toast.success("已更新名称");
							}}
						>
							保存名称
						</Button>
						<div className="grid min-w-0 gap-2">
							{model.drafts.map((d) => (
								<Button
									key={d.id}
									className="h-auto min-w-0 justify-start py-2 text-left whitespace-normal [overflow-wrap:anywhere]"
									aria-current={d.id === model.activeId ? "true" : undefined}
									variant={d.id === model.activeId ? "secondary" : "outline"}
									onClick={() => {
										if (model.switchDraft(d.id)) setRename(d.name);
									}}
								>
									{d.name}
									{d.id === model.activeId ? "（当前）" : ""}
								</Button>
							))}
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								onClick={() => {
									if (model.newDraft("blank")) onClose();
								}}
							>
								新建空白简历
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									if (model.newDraft("copy")) onClose();
								}}
							>
								复制当前简历
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							数据仅保存在当前浏览器；清除浏览器数据后会恢复样例。请导出 JSON 备份。
						</p>
					</>
				)}
				<Button data-focus-fallback variant="ghost" disabled={exporting} onClick={() => onClose()}>
					取消 / 返回编辑
				</Button>
			</DialogContent>
		</Dialog>
	);
}
