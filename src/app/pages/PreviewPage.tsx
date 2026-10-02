import { ThemeMenu } from "@/components/ThemeMenu";
import { useCallback, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LoaderCircle, Download, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";
import { useWorkspace } from "@/hooks/useWorkspace";
import { exportResumePdf } from "@/lib/exportResume";
import { cleanFilename, pdfFilename } from "@/lib/resumeFiles";

const A4_PX = (210 * 96) / 25.4;
export function PreviewPage() {
	const { resume, localError } = useWorkspace();
	const [layout, setLayout] = useState<ResumeLayoutInfo>({ pageCount: 1, height: 1123 });
	const [exporting, setExporting] = useState(false);
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
	if (localError)
		return (
			<div className="mx-auto grid min-h-screen max-w-lg place-content-center gap-4 px-6 text-center">
				<p role="alert">{localError}</p>
				<Button variant="outline" nativeButton={false} render={<Link to="/" />}>
					返回编辑
				</Button>
			</div>
		);
	const scale = zoom ?? fit;
	const mode = resume.meta.layoutMode;
	const exportPdf = async () => {
		setExporting(true);
		try {
			await exportResumePdf(mode, cleanFilename(pdfFilename(resume)));
		} catch {
			toast.error("导出失败，请重试");
		} finally {
			setExporting(false);
		}
	};
	return (
		<div className="public-stage min-h-screen bg-[var(--stage)] pb-16">
			<header className="no-print mx-auto flex max-w-[210mm] items-center justify-between gap-2 px-3 py-4">
				<Button
					variant="ghost"
					size="sm"
					className="max-sm:min-h-10"
					aria-label="返回编辑"
					title="返回编辑"
					nativeButton={false}
					render={<Link to="/" />}
				>
					<ArrowLeft />
					<span className="hidden sm:inline">返回编辑</span>
				</Button>
				<div className="flex items-center gap-1">
					<ThemeMenu />
					<Button variant="ghost" size="sm" onClick={() => setZoom(null)}>
						适应屏幕
					</Button>
					<Button
						variant="ghost"
						size="sm"
						aria-label="放大"
						title="放大"
						onClick={() => setZoom(Math.min(2, scale + 0.2))}
					>
						<ZoomIn />
						<span className="hidden sm:inline">放大</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						aria-label="缩小"
						title="缩小"
						onClick={() => setZoom(Math.max(0.2, scale - 0.2))}
					>
						<ZoomOut />
						<span className="hidden sm:inline">缩小</span>
					</Button>
				</div>
				<Button
					size="sm"
					aria-label={mode === "single" ? "导出长页 PDF" : "导出 A4 PDF"}
					title={mode === "single" ? "导出长页 PDF" : "导出 A4 PDF"}
					disabled={exporting}
					onClick={() => void exportPdf()}
				>
					{exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
					<span className="hidden sm:inline">
						{exporting ? "准备中…" : mode === "single" ? "导出长页 PDF" : "导出 A4 PDF"}
					</span>
				</Button>
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
		</div>
	);
}
