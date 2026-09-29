import { useCallback, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LoaderCircle, Download, ArrowLeft } from "lucide-react";
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
	return <div className="public-stage min-h-screen bg-[#e5e5ea] pb-16">
		<header className="no-print mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-5">
			{<Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/" />}><ArrowLeft />返回编辑</Button>}
			<div><p className="text-[15px] font-semibold">{resume.meta.hiddenBasics.includes("name") ? "个人简历" : `${resume.basics.name || "个人"}的简历`}</p><p className="mt-1 text-xs text-neutral-600">{mode === "single" ? "长页 PDF（图片内容）" : `A4 PDF · ${layout.pageCount} 页`}</p></div>
			<Button size="sm" disabled={exporting} onClick={() => void exportPdf()}><Download />{exporting ? "准备中…" : mode === "single" ? "导出长页 PDF" : "导出 A4 PDF"}</Button>
		</header>
		<div className="no-print mb-4 flex justify-center gap-2"><Button variant="ghost" size="sm" onClick={() => setZoom(null)}>适应屏幕</Button><Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, scale + .2))}>放大</Button><Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(.2, scale - .2))}>缩小</Button></div>
		<div ref={container} className="flex overflow-auto px-3 pb-3"><div className="preview-paper mx-auto" style={{ width: A4_PX * scale, height: layout.height * scale }}><div className="preview-scale" style={{ width: A4_PX, transform: `scale(${scale})` }}><div className="resume-frame"><ResumeDocument resume={resume} onLayout={handleLayout} /></div></div></div></div>
	</div>;
}
