import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoaderCircle, Printer } from "lucide-react";
import { DEFAULT_SLUG, normalizeResume, type Resume } from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import { fetchResume } from "@/lib/api";
import { loadLocalResume } from "@/lib/storage";

export function PublicResumePage() {
	const { slug = DEFAULT_SLUG } = useParams();
	const [resume, setResume] = useState<Resume | null>(null);
	const [source, setSource] = useState<"d1" | "local" | "sample">("sample");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

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
			<div className="flex min-h-screen items-center justify-center text-stone-500">
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
				<Button asChild>
					<Link to="/editor">回到编辑器</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="public-stage min-h-screen bg-[#ece8e1] pb-16">
			<div className="no-print mx-auto flex max-w-[210mm] items-center justify-between px-4 py-4">
				<div>
					<p className="text-sm font-semibold">{resume.basics.name} 的在线简历</p>
					<p className="text-xs text-muted-foreground">
						/{slug}
						{source === "d1" ? " · 来自 D1" : source === "local" ? " · 来自本机草稿" : " · 示例数据"}
					</p>
				</div>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" asChild>
						<Link to="/editor">编辑</Link>
					</Button>
					<Button size="sm" onClick={() => window.print()}>
						<Printer /> 导出 PDF
					</Button>
				</div>
			</div>
			<div className="flex justify-center px-3">
				<div className="resume-shadow overflow-hidden rounded-sm shadow-[0_18px_50px_rgba(28,25,23,0.16)]">
					<ResumeDocument resume={resume} />
				</div>
			</div>
		</div>
	);
}
