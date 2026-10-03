import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Resume } from "@shared/schema";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { exportResumePdf } from "@/lib/exportResume";
import { cleanFilename, pdfFilename } from "@/lib/resumeFiles";
import type { ResumeLayoutInfo } from "@/hooks/useResumeFit";

export function ExportDialog({ resume, onClose }: { resume: Resume; onClose: () => void }) {
 // Keep a stable copy while a read-only page continues to receive saved updates.
 const [snapshot] = useState(() => structuredClone(resume));
 const [mode, setMode] = useState(snapshot.meta.layoutMode);
 const [filename, setFilename] = useState(() => pdfFilename(snapshot));
 const [exporting, setExporting] = useState(false);
 const [overflow, setOverflow] = useState(false);
 const [printHelp] = useState(() => {
  try { return localStorage.getItem("yizhi:print-help") !== "off"; } catch { return true; }
 });
 const onLayout = useCallback((info: ResumeLayoutInfo) => setOverflow(!!info.overflow), []);
 const host = useRef<HTMLDivElement>(null);
 const copy = useMemo(() => ({ ...snapshot, meta: { ...snapshot.meta, layoutMode: mode } }), [snapshot, mode]);
 const exportPdf = async () => {
  if (exporting) return;
  const source = host.current?.querySelector<HTMLElement>(".resume-print-root");
  if (!source) return;
  setExporting(true);
  try { await exportResumePdf(mode, cleanFilename(filename), source); onClose(); }
  catch (error) { toast.error(error instanceof Error ? error.message : "导出失败，请重试"); }
  finally { setExporting(false); }
 };
 return <Dialog open onOpenChange={open => { if (!open && !exporting) onClose(); }}>
  <DialogContent className="max-h-[85dvh] overflow-auto sm:max-w-lg" showCloseButton={!exporting}>
   <DialogTitle>导出简历</DialogTitle>
   <DialogDescription>导出打开此窗口时的简历。格式选择仅用于此次下载。</DialogDescription>
   <label className="grid gap-2">文件名<Input value={filename} disabled={exporting} onChange={e => setFilename(e.target.value)} /></label>
   <label className="grid gap-2">导出格式
    <select className="editor-select" value={mode} disabled={exporting} onChange={e => setMode(e.target.value as "multi" | "single")}>
     <option value="multi">A4 PDF（文字内容）</option><option value="single">长页 PDF（图片内容）</option>
    </select>
   </label>
   {!snapshot.basics.name.trim() && <p className="text-amber-800 dark:text-amber-300">姓名尚未填写。</p>}
   {!["email", "phone"].some(key => !snapshot.meta.hiddenBasics.includes(key as "email" | "phone") && snapshot.basics[key as "email" | "phone"]?.trim()) &&
    <p className="text-amber-800 dark:text-amber-300">邮箱和电话均为空或隐藏，招聘者可能无法联系你。</p>}
   {mode === "multi" && overflow && <p className="text-amber-800 dark:text-amber-300">存在超长条目，请检查分页和打印预览中的裁切。</p>}
   {mode === "multi" && printHelp && <div className="rounded-lg bg-secondary p-3 text-sm leading-6">
    在打印窗口选择“另存为 PDF”，纸张选 A4，缩放为 100%，关闭页眉和页脚。请检查预览后保存。
    <label className="mt-2 flex min-h-11 items-center gap-2"><input type="checkbox" onChange={e => {
     try { localStorage.setItem("yizhi:print-help", e.target.checked ? "off" : "on"); } catch { /* Optional preference. */ }
    }} />下次不再提示</label>
   </div>}
   {mode === "single" && <p className="text-sm text-muted-foreground">此格式生成长页 PDF，文字以图片呈现。投递简历建议使用 A4 PDF。</p>}
   <Button disabled={exporting} onClick={() => void exportPdf()}>{exporting ? "正在准备…" : mode === "multi" ? "打开打印窗口" : "下载长页 PDF"}</Button>
   <Button variant="ghost" disabled={exporting} onClick={onClose}>取消</Button>
   <div ref={host} className="export-render-host" aria-hidden="true" inert><ResumeDocument resume={copy} onLayout={onLayout} /></div>
  </DialogContent>
 </Dialog>;
}
