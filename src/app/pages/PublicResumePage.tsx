import { useCallback, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LoaderCircle, Share } from "lucide-react";
import { DEFAULT_SLUG, normalizeResume, type Resume } from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";
import { fetchResume } from "@/lib/api";
import { exportResumePdf } from "@/lib/exportResume";
import { loadLocalResume } from "@/lib/storage";

export function PublicResumePage() {
	const { slug = DEFAULT_SLUG } = useParams();
	const [resume, setResume] = useState<Resume | null>(null);
	const [source, setSource] = useState<"d1" | "local" | "sample">("sample");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [layoutInfo, setLayoutInfo] = useState<ResumeLayoutInfo>({ pageCount: 1, height: 0 });
	const [exporting, setExporting] = useState(false);
	const handleLayout = useCallback((info: ResumeLayoutInfo) => {
		setLayoutInfo(info);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);
			const remote = await fetchResume(slug);
			if (cancelled) return;
			if (remote?.data) {
				setResume(normalizeResume(remote.data));
				setSource(remote.fallback ? "sample" : "d1");
				setLoading(false);
				return;
			}
			if (slug === DEFAULT_SLUG || slug === "default") {
				try {
					setResume(loadLocalResume());
					setSource("local");
				} catch {
					setResume(structuredClone(SAMPLE_RESUME));
					setSource("sample");
				}
				setLoading(false);
				return;
			}
			setResume(null);
			setError("没有找到这份简历。请先在编辑器保存，或打开默认公开页。");
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [slug]);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center text-neutral-500">
				<LoaderCircle className="mr-2 size-5 animate-spin" />
				正在加载简历…
			</div>
		);
	}

	if (error || !resume) {
		return (
			<div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
				<h1 className="text-xl font-semibold">简历不存在</h1>
				<p className="text-sm text-muted-foreground">{error}</p>
				<Button render={<Link to="/editor" />}>回到编辑器</Button>
			</div>
		);
	}

	const layoutMode = resume.meta.layoutMode === "single" ? "single" : "multi";

	const handleExport = async () => {
		setExporting(true);
		try {
			await exportResumePdf(layoutMode, `resume-${slug}.pdf`);
			toast.success(layoutMode === "single" ? "已导出长图 PDF" : "已打开打印对话框");
		} catch {
			toast.error("导出失败，请重试");
		} finally {
			setExporting(false);
		}
	};

	return (
		<div className="public-stage min-h-screen bg-[#e5e5ea] pb-16">
			<div className="no-print mx-auto flex max-w-[210mm] items-center justify-between px-4 py-5">
				<div>
					<p className="text-[15px] font-semibold tracking-tight">{resume.basics.name} 的简历</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{source === "d1" ? "云端" : source === "local" ? "本机草稿" : "示例"}
						{" · "}
						{layoutMode === "single" ? "长图分享" : `A4 · ${layoutInfo.pageCount} 页`}
					</p>
				</div>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" render={<Link to="/editor" />}>
						编辑
					</Button>
					<Button size="sm" disabled={exporting} onClick={() => void handleExport()}>
						<Share data-icon="inline-start" />
						{exporting ? "导出中" : layoutMode === "single" ? "导出长图" : "导出 A4"}
					</Button>
				</div>
			</div>
			<div className="flex justify-center px-3">
				<div className="resume-frame">
					<ResumeDocument resume={resume} onLayout={handleLayout} />
				</div>
			</div>
		</div>
	);
}
