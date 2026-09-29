
const A4_WIDTH_MM = 210;

function resumeRoot(): HTMLElement {
	const node = document.querySelector<HTMLElement>(".resume-print-root");
	if (!node) throw new Error("未找到简历预览");
	return node;
}

async function waitForImages(root: ParentNode) {
	await Promise.all([...root.querySelectorAll("img")].map(img => {
		if (img.complete) return img.naturalWidth ? Promise.resolve() : Promise.reject(new Error("照片未能加载，请重新上传照片后再导出"));
		return new Promise<void>((resolve, reject) => {
			const cleanup = () => { clearTimeout(timer); img.removeEventListener("load", loaded); img.removeEventListener("error", failed); };
			const loaded = () => { cleanup(); resolve(); };
			const failed = () => { cleanup(); reject(new Error("照片未能加载，请重新上传照片后再导出")); };
			const timer = setTimeout(failed, 10000);
			img.addEventListener("load", loaded, { once: true }); img.addEventListener("error", failed, { once: true });
		});
	}));
}

export async function waitForPrintStyles(doc: Document) {
	await Promise.all([...doc.querySelectorAll<HTMLLinkElement>("link[rel=stylesheet]")].map(link => {
		if (link.sheet) return Promise.resolve();
		return new Promise<void>((resolve, reject) => {
			const cleanup = () => { clearTimeout(timer); link.removeEventListener("load", loaded); link.removeEventListener("error", failed); };
			const loaded = () => { cleanup(); resolve(); };
			const failed = () => { cleanup(); reject(new Error("打印样式未能加载，请重试")); };
			const timer = setTimeout(failed, 10000);
			link.addEventListener("load", loaded, { once: true });
			link.addEventListener("error", failed, { once: true });
		});
	}));
}

function copyDocumentStyles(target: Document) {
	for (const node of document.querySelectorAll("link[rel='stylesheet'], style")) {
		target.head.appendChild(node.cloneNode(true));
	}
	const printStyle = target.createElement("style");
	printStyle.textContent = `
		@page { size: A4; margin: 14.5mm 16mm; }
		html, body {
			margin: 0 !important;
			padding: 0 !important;
			background: #fff !important;
			min-height: 0 !important;
		}
		* { box-shadow: none !important; text-shadow: none !important; filter: none !important; }
		.resume-sheet, .resume-print-root {
			width: auto !important;
			max-width: none !important;
			height: auto !important;
			min-height: 0 !important;
			padding: 0 !important;
			overflow: visible !important;
			box-shadow: none !important;
			background: #fff !important;
			transform: none !important;
		}
		.resume-sheet::after { display: none !important; }
		.resume-heading { break-after: avoid; page-break-after: avoid; }
		.resume-entry, .resume-skill { break-inside: avoid; page-break-inside: avoid; }
		.resume-entry[data-oversized] { break-inside:auto; page-break-inside:auto; }
		.resume-page-spacer {
			height: 0 !important;
			margin: 0 !important;
			break-after: page;
			page-break-after: always;
		}
	`;
	target.head.appendChild(printStyle);
}

async function snapshotSheet(sheet: HTMLElement) {
	const { domToPng } = await import("modern-screenshot");
	const host = document.createElement("div");
	Object.assign(host.style, {
		position: "fixed",
		left: "-12000px",
		top: "0",
		width: "210mm",
		background: "#fff",
		pointerEvents: "none",
		zIndex: "-1",
	});
	const clone = sheet.cloneNode(true) as HTMLElement;
	clone.style.transform = "none";
	clone.style.height = "auto";
	clone.style.minHeight = "0";
	clone.style.overflow = "visible";
	clone.style.boxShadow = "none";
	host.appendChild(clone);
	document.body.appendChild(host);
	try {
		await document.fonts?.ready;
		await waitForImages(clone);
		return await domToPng(clone, {
			scale: 2,
			backgroundColor: "#ffffff",
			quality: 1,
		});
	} finally {
		host.remove();
	}
}

/** 长图分享：整份简历渲成一张图，PDF 高度随内容变化。 */
export async function createSharePdf(dataUrl: string, width: number, height: number) {
	const { jsPDF } = await import("jspdf");
	const heightMm = Math.max(80, height / width * A4_WIDTH_MM);
	if (heightMm > 5000) throw new Error("内容过长，请改用 A4 PDF 分页导出");
	const pdf = new jsPDF({
		orientation: heightMm < A4_WIDTH_MM ? "landscape" : "portrait",
		unit: "mm", format: [A4_WIDTH_MM, heightMm], compress: true,
	});
	pdf.addImage(dataUrl, "PNG", 0, 0, A4_WIDTH_MM, height / width * A4_WIDTH_MM, undefined, "FAST");
	return pdf;
}
export async function exportShareImagePdf(filename: string) {
	const dataUrl = await snapshotSheet(resumeRoot());
	const img = new Image(); img.src = dataUrl; await img.decode();
	const pdf = await createSharePdf(dataUrl, img.width, img.height);
	pdf.save(filename);
}

/** A4 投递：隔离文档打印，不含编辑器阴影和缩放层。 */
export async function exportPrintablePdf(filename = "简历.pdf") {
	const source = resumeRoot();
	await document.fonts?.ready;
	await waitForImages(source);

	const iframe = document.createElement("iframe");
	iframe.setAttribute("aria-hidden", "true");
	Object.assign(iframe.style, {
		position: "fixed",
		right: "0",
		bottom: "0",
		width: "0",
		height: "0",
		border: "0",
		visibility: "hidden",
	});
	document.body.appendChild(iframe);

	const frameWindow = iframe.contentWindow;
	const frameDocument = iframe.contentDocument;
	if (!frameWindow || !frameDocument) {
		iframe.remove();
		throw new Error("无法打开打印视图");
	}

	frameDocument.open();
	frameDocument.write("<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>");
	frameDocument.close();
	frameDocument.title = filename.replace(/\.pdf$/i, "");
	copyDocumentStyles(frameDocument);

	const clone = source.cloneNode(true) as HTMLElement;
	clone.style.transform = "none";
	clone.style.boxShadow = "none";
	clone.style.height = "auto";
	clone.style.minHeight = "0";
	clone.style.overflow = "visible";
	frameDocument.body.style.margin = "0";
	frameDocument.body.style.background = "#fff";
	frameDocument.body.appendChild(clone);

	try {
		await waitForPrintStyles(frameDocument);
		await frameDocument.fonts?.ready;
		await waitForImages(clone);
		await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
		const cleanup = () => iframe.remove();
		frameWindow.addEventListener("afterprint", cleanup, { once: true });
		window.setTimeout(cleanup, 60_000);
		frameWindow.focus(); frameWindow.print();
	} catch (error) { iframe.remove(); throw error; }
}

export async function exportResumePdf(mode: "single" | "multi", filename: string) {
	if (mode === "single") {
		await exportShareImagePdf(filename);
		return;
	}
	await exportPrintablePdf(filename);
}
