import { useState } from "react";
import { toast } from "sonner";
import type { Resume } from "@shared/schema";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { exportResumePdf } from "@/lib/exportResume";
import { cleanFilename, pdfFilename, downloadJson } from "@/lib/resumeFiles";

export type EditorPanel = "import" | "export" | "recovery" | "manage" | "reset";
const stamp = (time: string) => new Date(time).toLocaleString("zh-CN", { hour12: false });

interface EditorDialogProps {
	panel: EditorPanel;
	imported: Resume | null;
	preview: boolean;
	overflow?: boolean;
	onPreviewChange: (preview: boolean) => void;
	onClose: () => void;
}

export function EditorDialog({
	panel,
	imported,
	preview,
	overflow,
	onPreviewChange,
	onClose,
}: EditorDialogProps) {
	const model = useWorkspace();
	const { resume, setResume } = model;
	const mode = resume.meta.layoutMode;
	const [filename, setFilename] = useState(() => pdfFilename(resume));
	const [rename, setRename] = useState(() => model.drafts.find((d) => d.id === model.activeId)!.name);
	const [exporting, setExporting] = useState(false);
	const [printHelp, setPrintHelp] = useState(() => {
		try {
			return localStorage.getItem("yizhi:print-help") !== "off";
		} catch {
			return true;
		}
	});
	const warning: string[] = [];
	if (!resume.basics.name.trim()) warning.push("姓名尚未填写。");
	if (
		!["email", "phone"].some(
			(key) =>
				!resume.meta.hiddenBasics.includes(key as "email" | "phone") &&
				resume.basics[key as "email" | "phone"]?.trim(),
		)
	)
		warning.push("邮箱和电话均为空或隐藏，招聘者可能无法联系你。");
	if (overflow) warning.push("存在超长条目，请检查分页和打印预览中的裁切。");
	const exportPdf = async () => {
		setExporting(true);
		const previousPreview = preview;
		onPreviewChange(true);
		await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
		try {
			await exportResumePdf(mode, cleanFilename(filename));
			onClose();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "导出失败，请重试；当前内容仍保留在编辑器");
		} finally {
			setExporting(false);
			onPreviewChange(previousPreview);
		}
	};

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
								export: "导出简历",
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
							: panel === "export"
								? "导出当前编辑内容。"
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
				{panel === "export" && (
					<>
						<label className="grid gap-2">
							文件名
							<Input value={filename} onChange={(e) => setFilename(e.target.value)} />
						</label>
						<label className="grid gap-2">
							导出格式
							<select
								className="editor-select"
								value={mode}
								onChange={(e) =>
									setResume((c) => ({
										...c,
										meta: { ...c.meta, layoutMode: e.target.value as "multi" | "single" },
									}))
								}
							>
								<option value="multi">A4 PDF（文字内容）</option>
								<option value="single">长页 PDF（图片内容）</option>
							</select>
						</label>
						{warning.length > 0 && (
							<ul className="list-disc pl-5 text-amber-800 dark:text-amber-300">
								{warning.map((w) => (
									<li key={w}>{w}</li>
								))}
							</ul>
						)}
						{mode === "multi" && printHelp && (
							<div className="rounded-lg bg-secondary p-3 text-sm leading-6">
								在打印窗口选择“另存为 PDF”，纸张选 A4，缩放为 100%，关闭页眉和页脚。请检查预览后保存。
								<label className="mt-2 flex items-center gap-2">
									<input
										type="checkbox"
										onChange={(e) => {
											try {
												localStorage.setItem("yizhi:print-help", e.target.checked ? "off" : "on");
											} catch {
												/* Optional preference. */
											}
										}}
									/>{" "}
									下次不再提示
								</label>
							</div>
						)}
						{mode === "single" && (
							<p className="text-muted-foreground">
								此格式生成 PDF，文字以图片呈现，不是 PNG/JPG。投递简历建议使用 A4 PDF。
							</p>
						)}
						<Button
							disabled={exporting}
							onClick={() => {
								void exportPdf().then(() => {
									try {
										setPrintHelp(localStorage.getItem("yizhi:print-help") !== "off");
									} catch {
										/* Optional preference. */
									}
								});
							}}
						>
							{exporting ? "正在准备…" : mode === "multi" ? "打开打印窗口" : "下载长页 PDF"}
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
							<div key={b.id} className="border-b pb-3">
								<p>
									{b.label} · {b.data.basics.name || "未填写姓名"}
								</p>
								<p className="my-2 text-xs text-muted-foreground">{stamp(b.time)}</p>
								<div className="flex gap-2">
									<Button
										size="sm"
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
										onClick={() => downloadJson(b.data, `恢复点-${b.time.slice(0, 10)}.json`)}
									>
										下载
									</Button>
									<Button size="sm" variant="ghost" onClick={() => model.removeBackup(b.id)}>
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
						<div className="grid gap-2">
							{model.drafts.map((d) => (
								<Button
									key={d.id}
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
				<Button variant="ghost" disabled={exporting} onClick={() => onClose()}>
					取消 / 返回编辑
				</Button>
			</DialogContent>
		</Dialog>
	);
}
