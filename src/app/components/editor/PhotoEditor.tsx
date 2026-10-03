import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export function PhotoEditor({ photo, visible, onChange, onVisibilityChange }: { photo?: string; visible: boolean; onChange: (photo?: string) => void; onVisibilityChange: (visible: boolean) => void }) {
	const [source, setSource] = useState<HTMLImageElement | null>(null);
	const [rotation, setRotation] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [x, setX] = useState(0);
	const [y, setY] = useState(0);
	const [reading, setReading] = useState(false);
	const canvas = useRef<HTMLCanvasElement>(null);
	const file = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (!source || !canvas.current) return;
		const c = canvas.current; const ctx = c.getContext("2d"); if (!ctx) return;
		ctx.fillStyle = "white"; ctx.fillRect(0, 0, c.width, c.height);
		const sideways = rotation % 180 !== 0;
		const width = sideways ? source.height : source.width, height = sideways ? source.width : source.height;
		const scale = Math.max(c.width / width, c.height / height) * zoom;
		ctx.save(); ctx.translate(c.width / 2 + x * c.width / 100, c.height / 2 + y * c.height / 100); ctx.rotate(rotation * Math.PI / 180); ctx.scale(scale, scale);
		ctx.drawImage(source, -source.width / 2, -source.height / 2); ctx.restore();
	}, [source, rotation, zoom, x, y]);
	const load = async (selected: File) => {
		if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) { toast.error("请选择 JPG、PNG 或 WebP 照片"); return; }
		if (selected.size > 10 * 1024 * 1024) { toast.error("照片不能超过 10 MB"); return; }
		setReading(true); const url = URL.createObjectURL(selected);
		try { const image = new Image(); image.src = url; await image.decode(); if (image.width * image.height > 40_000_000) throw new Error(); setRotation(0); setZoom(1); setX(0); setY(0); setSource(image); }
		catch { toast.error("无法读取照片，请换一张较小的图片；原照片已保留"); }
		finally { URL.revokeObjectURL(url); setReading(false); }
	};
	return <div>
		<div className="flex items-center gap-4">
			<button type="button" className="group flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-card transition-colors hover:border-ring disabled:opacity-50" aria-label={photo ? "更换照片" : "添加照片"} title={photo ? "更换照片" : "添加照片"} disabled={reading} onClick={() => file.current?.click()}>
				{photo ? <img src={photo} alt="当前简历照片" className="h-full w-full object-contain" /> : <ImagePlus className="size-5 text-muted-foreground group-hover:text-muted-foreground" />}
			</button>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-1">
					<Button size="sm" variant="outline" disabled={reading} onClick={() => file.current?.click()}>{reading ? "读取中…" : photo ? "更换" : "上传照片"}</Button>
					{photo && <Button size="sm" variant="ghost" aria-label="移除照片" className="text-muted-foreground" onClick={() => onChange(undefined)}>移除</Button>}
				</div>
				{photo ? <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" className="size-3.5 accent-primary" checked={visible} onChange={e => onVisibilityChange(e.target.checked)} />在简历中显示照片</label> : <p className="mt-2 text-xs leading-5 text-muted-foreground">JPG / PNG / WebP · 最大 10 MB</p>}
			</div>
		</div>
		<input ref={file} type="file" accept="image/jpeg,image/png,image/webp" aria-label="选择照片" className="hidden" onChange={e => { const selected = e.target.files?.[0]; e.target.value = ""; if (selected) void load(selected); }} />
		<Dialog open={!!source} onOpenChange={open => { if (!open) setSource(null); }}><DialogContent className="max-h-[90dvh] overflow-auto"><DialogTitle>调整照片</DialogTitle><DialogDescription>预览裁剪范围，确认后替换照片。取消会保留原照片。</DialogDescription>
			<canvas ref={canvas} width={480} height={600} className="mx-auto w-40 rounded border" aria-label="照片裁剪预览" />
			<Button variant="outline" onClick={() => setRotation(r => (r + 90) % 360)}>旋转 90°</Button>
			<label>缩放<input className="w-full" type="range" min={1} max={3} step={.05} value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
			<label>左右位置<input className="w-full" type="range" min={-50} max={50} value={x} onChange={e => setX(Number(e.target.value))} /></label>
			<label>上下位置<input className="w-full" type="range" min={-50} max={50} value={y} onChange={e => setY(Number(e.target.value))} /></label>
			<Button onClick={() => { try { const data = canvas.current?.toDataURL("image/jpeg", .82); if (!data) throw new Error(); onChange(data); setSource(null); } catch { toast.error("照片处理失败，原照片已保留"); } }}>使用这张照片</Button><Button variant="ghost" onClick={() => setSource(null)}>取消</Button>
		</DialogContent></Dialog>
	</div>;
}
