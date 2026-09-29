import { ThemeMenu } from "@/components/ThemeMenu";
import { useCallback, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LoaderCircle, Download, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import { type Resume } from "@shared/schema";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";
import { loadWorkspace } from "@/lib/draftStore";
import { exportResumePdf } from "@/lib/exportResume";
import { cleanFilename, pdfFilename } from "@/lib/draftStore";

const A4_PX = 210 * 96 / 25.4;
export function PublicResumePage() {
	const [resume, setResume] = useState<Resume | null>(null);
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);
	const [attempt, setAttempt] = useState(0);
	const [layout, setLayout] = useState<ResumeLayoutInfo>({ pageCount: 1, height: 1123 });
	const [exporting, setExporting] = useState(false);
	const [fit, setFit] = useState(1);
	const [zoom, setZoom] = useState<number | null>(null);
	const container = useRef<HTMLDivElement>(null);
	const handleLayout = useCallback((info: ResumeLayoutInfo) => setLayout(info), []);
	useEffect(() => {
		try { const workspace = loadWorkspace(); setResume(workspace.drafts.find(d => d.id === workspace.activeId)!.data); setError(false); }
		catch { setError(true); }
		setLoading(false);
	}, [attempt]);

	useEffect(() => {
		const node = container.current; if (!node) return;
		const update = () => setFit(Math.min(1, Math.max(.1, (node.clientWidth - 24) / A4_PX)));
		update(); const observer = new ResizeObserver(update); observer.observe(node); return () => observer.disconnect();
	}, [loading, resume]);
	if (loading) return <div role="status" className="flex min-h-screen items-center justify-center text-neutral-500"><LoaderCircle className="mr-2 size-5 animate-spin" />正在加载简历…</div>;
	if (error || !resume) return <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
		<h1 className="text-xl font-semibold">暂时无法读取本机简历</h1>
		<p className="text-sm text-muted-foreground">请重试，或返回编辑器检查本机保存状态。</p>
		<div className="flex gap-2"><Button onClick={() => setAttempt(n => n + 1)}>重新加载</Button><Button variant="outline" nativeButton={false} render={<Link to="/" />}>返回编辑</Button></div>
	</div>;
	const scale = zoom ?? fit;
	const mode = resume.meta.layoutMode;
	const exportPdf = async () => {
		setExporting(true);
		try { await exportResumePdf(mode, cleanFilename(pdfFilename(resume))); }
		catch { toast.error("导出失败，请重试"); }
		finally { setExporting(false); }
	};
	return <div className="public-stage min-h-screen bg-[var(--stage)] pb-16">
		<header className="no-print mx-auto flex max-w-[210mm] items-center justify-between gap-2 px-3 py-4">
			<Button variant="ghost" size="sm" className="max-sm:min-h-10" aria-label="返回编辑" title="返回编辑" nativeButton={false} render={<Link to="/" />}><ArrowLeft /><span className="hidden sm:inline">返回编辑</span></Button>
			<div className="flex items-center gap-1">
				<ThemeMenu />
				<Button variant="ghost" size="sm" onClick={() => setZoom(null)}>适应屏幕</Button>
				<Button variant="ghost" size="sm" aria-label="放大" title="放大" onClick={() => setZoom(Math.min(2, scale + .2))}><ZoomIn /><span className="hidden sm:inline">放大</span></Button>
				<Button variant="ghost" size="sm" aria-label="缩小" title="缩小" onClick={() => setZoom(Math.max(.2, scale - .2))}><ZoomOut /><span className="hidden sm:inline">缩小</span></Button>
			</div>
			<Button size="sm" aria-label={mode === "single" ? "导出长页 PDF" : "导出 A4 PDF"} title={mode === "single" ? "导出长页 PDF" : "导出 A4 PDF"} disabled={exporting} onClick={() => void exportPdf()}>{exporting ? <LoaderCircle className="animate-spin" /> : <Download />}<span className="hidden sm:inline">{exporting ? "准备中…" : mode === "single" ? "导出长页 PDF" : "导出 A4 PDF"}</span></Button>
		</header>
		<div ref={container} className="flex overflow-auto px-3 pb-3"><div className="preview-paper mx-auto" style={{ width: A4_PX * scale, height: layout.height * scale }}><div className="preview-scale" style={{ width: A4_PX, transform: `scale(${scale})` }}><div className="resume-frame"><ResumeDocument resume={resume} onLayout={handleLayout} /></div></div></div></div>
	</div>;
}
