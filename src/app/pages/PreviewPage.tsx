import { ThemeMenu } from "@/components/ThemeMenu";
import { useCallback, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, ArrowLeft, FileJson, Scan, ZoomIn, ZoomOut } from "lucide-react";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ExportDialog } from "@/components/ExportDialog";
import { cleanFilename, pdfFilename, downloadJson } from "@/lib/resumeFiles";

const A4_PX = (210 * 96) / 25.4;
export function PreviewPage() {
	const model = useWorkspace();
	const { resume, localError, canEdit, accessState } = model;
	const navigate = useNavigate();
	const [layout, setLayout] = useState<ResumeLayoutInfo>({ pageCount: 1, height: 1123 });
	const [exportOpen, setExportOpen] = useState(false);
	const [fit, setFit] = useState(1);
	const [zoom, setZoom] = useState<number | null>(null);
	const container = useRef<HTMLDivElement>(null);
	const handleLayout = useCallback((info: ResumeLayoutInfo) => setLayout(info), []);

	useEffect(() => {
		const node = container.current;
		if (!node) return;
		const update = () => setFit(Math.min(1, Math.max(0.1, (node.clientWidth - 24) / A4_PX)));
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		return () => observer.disconnect();
	}, [localError]);
	const scale = zoom ?? fit;
 const requestEdit = async () => {
  if (await model.requestEdit()) navigate("/");
  else if (accessState !== "unsupported") toast.message("编辑页仍在使用中。关闭原编辑页后可在此继续。");
 };
	return (
		<div className="public-stage min-h-screen bg-[var(--stage)] pb-16">
   <header className="public-toolbar no-print mx-auto max-w-[210mm] px-3 py-4">
    <div className="workspace-status-row">
     <strong className="workspace-name">{model.drafts.find(d => d.id === model.activeId)!.name}</strong>
     <span className="save-status" role="status" data-error={!!localError}>{localError ? (model.localConflict ? "保存已暂停" : "读取或保存失败") : canEdit ? (model.localPending ? "保存中…" : "已保存到本机") : "只读预览"}</span>
    </div>
    {!canEdit && <p className="readonly-notice" role="status">{accessState === "unsupported"
     ? "当前浏览器无法安全开启编辑。你仍可预览和下载备份，请使用支持 Web Locks 的浏览器编辑。"
     : accessState === "checking" ? "正在检查编辑权…" : localError ? "当前预览已保留。请查看下方提示，并下载可用备份。" : "另一个页面正在编辑。这里会跟随已保存内容更新；关闭原编辑页后，可在此继续编辑。"}</p>}
    {localError && <p className="save-notice" role="alert">{localError}</p>}
    <div className="public-toolbar-controls">
     <div className="public-toolbar-navigation">
      {canEdit ? <Button variant="ghost" size="sm" aria-label="返回编辑" title="返回编辑" nativeButton={false} render={<Link to="/" />}><ArrowLeft /><span className="hidden sm:inline">返回编辑</span></Button>
       : accessState !== "unsupported" && accessState !== "editor" && !model.localConflict && <Button size="sm" variant="outline" disabled={accessState === "checking"} onClick={() => void requestEdit()}>在此编辑</Button>}
     </div>
     <div className="public-toolbar-view" role="group" aria-label="预览设置">
      <ThemeMenu />
      <Button variant="ghost" size="sm" aria-label="适应屏幕" title="适应屏幕" onClick={() => setZoom(null)}><Scan className="sm:hidden" /><span className="hidden sm:inline">适应屏幕</span></Button>
      <Button variant="ghost" size="icon" aria-label="缩小预览" title="缩小预览" onClick={() => setZoom(Math.max(0.2, scale - 0.2))}><ZoomOut /></Button>
      <span className="public-toolbar-zoom-value">{Math.round(scale * 100)}%</span>
      <Button variant="ghost" size="icon" aria-label="放大预览" title="放大预览" onClick={() => setZoom(Math.min(2, scale + 0.2))}><ZoomIn /></Button>
     </div>
     <div className="public-toolbar-actions" role="group" aria-label="简历下载">
      <Button variant="ghost" size="sm" aria-label="下载 JSON 备份" title="下载 JSON 备份" onClick={() => downloadJson(resume, cleanFilename(pdfFilename(resume)).replace(/\.pdf$/, ".json"))}><FileJson className="sm:hidden" /><span className="hidden sm:inline">下载 JSON 备份</span></Button>
      <Button size="sm" aria-label="导出简历" title="导出简历" onClick={() => setExportOpen(true)}><Download /><span className="hidden sm:inline">导出简历</span></Button>
     </div>
    </div>
   </header>
			<div ref={container} className="flex overflow-auto px-3 pb-3">
				<div
					className="preview-paper mx-auto"
					style={{ width: A4_PX * scale, height: layout.height * scale }}
				>
					<div className="preview-scale" style={{ width: A4_PX, transform: `scale(${scale})` }}>
						<div className="resume-frame">
							<ResumeDocument resume={resume} onLayout={handleLayout} />
						</div>
					</div>
				</div>
			</div>
			{exportOpen && <ExportDialog resume={resume} onClose={() => setExportOpen(false)} />}
		</div>
	);
}
