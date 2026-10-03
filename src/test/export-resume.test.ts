import { describe, expect, it, vi } from "vitest";
import { createSharePdf, exportResumePdf, waitForPrintStyles } from "@/lib/exportResume";

describe("exportResumePdf", () => {
	it("prints explicit page starts in an isolated copy and cleans it up after print", async () => {
		const source = document.createElement("article");
		source.className = "resume-print-root";
		source.innerHTML = '<ul><li>First</li><li class="resume-page-spacer" aria-hidden="true" style="height:120px"></li><li data-page-start>Second</li></ul>';
		document.body.append(source);
		const print = vi.fn();
		const append = document.body.appendChild.bind(document.body);
		const spy = vi.spyOn(document.body, "appendChild").mockImplementation(node => {
			const result = append(node);
			if (node instanceof HTMLIFrameElement) {
				node.contentWindow!.focus = vi.fn();
				node.contentWindow!.print = print;
			}
			return result;
		});
		vi.useFakeTimers();
		vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0; });
		try {
			await exportResumePdf("multi", "test.pdf", source);
			expect(print).toHaveBeenCalledOnce();
			const frame = document.querySelector("iframe")!;
			expect(frame.contentDocument!.querySelector("[data-page-start]")?.textContent).toBe("Second");
			const styles = frame.contentDocument!.querySelector("style")!.textContent;
			expect(styles).toContain("break-before: page");
			expect(styles).toMatch(/resume-page-spacer\s*\{\s*display: none/);
			frame.contentWindow!.dispatchEvent(new Event("afterprint"));
			expect(frame.isConnected).toBe(false);
			expect(source.isConnected).toBe(true);
			expect(source.querySelectorAll("li")).toHaveLength(3);
		} finally {
			document.querySelector("iframe")?.remove(); source.remove();
			spy.mockRestore(); vi.clearAllTimers(); vi.unstubAllGlobals(); vi.useRealTimers();
		}
	});
	it("throws when the preview root is missing", async () => {
		await expect(exportResumePdf("multi", "resume.pdf")).rejects.toThrow("未找到简历预览");
		await expect(exportResumePdf("single", "resume.pdf")).rejects.toThrow("未找到简历预览");
	});
});

describe("image PDF page geometry", () => {
	const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAACgCAIAAABIaz/HAAABL0lEQVR4nO3QAQkAIADAMIMZzGAGtIXCHTzA2Zhr60Lj+cEngQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnSrA4lYfig3Hp9/AAAAAElFTkSuQmCC";
	it("keeps a short page 210mm wide instead of swapping width and height", async () => {
		const pdf = await createSharePdf(image, 800, 400);
		expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 2);
		expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(105, 2);
	});
	it("preserves the width and aspect ratio of a tall page", async () => {
		const pdf = await createSharePdf(image, 800, 1600);
		expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 2);
		expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(420, 2);
	});
	it("rejects pages beyond the PDF size limit", async () => {
		await expect(createSharePdf(image, 800, 40000)).rejects.toThrow("内容过长");
	});
});


describe("print stylesheet readiness", () => {
	it("waits for stylesheet load before allowing print", async () => {
		const doc = document.implementation.createHTMLDocument();
		const link = doc.createElement("link"); link.rel = "stylesheet"; link.href = "/assets/print.css"; doc.head.append(link);
		let ready = false; const waiting = waitForPrintStyles(doc).then(() => { ready = true; });
		await Promise.resolve(); expect(ready).toBe(false);
		link.dispatchEvent(new Event("load")); await waiting; expect(ready).toBe(true);
	});
	it("fails clearly instead of printing unstyled content", async () => {
		const doc = document.implementation.createHTMLDocument();
		const link = doc.createElement("link"); link.rel = "stylesheet"; link.href = "/missing.css"; doc.head.append(link);
		const waiting = waitForPrintStyles(doc); link.dispatchEvent(new Event("error"));
		await expect(waiting).rejects.toThrow("打印样式未能加载");
	});
});
