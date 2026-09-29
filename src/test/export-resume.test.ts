import { describe, expect, it } from "vitest";
import { createSharePdf, exportResumePdf, waitForPrintStyles } from "@/lib/exportResume";

describe("exportResumePdf", () => {
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
