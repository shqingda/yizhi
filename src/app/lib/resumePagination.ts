import type { PaginateBlock, PageBreak } from "@shared/paginate";

export const SPACER_CLASS = "resume-page-spacer";
interface MeasuredBlock extends PaginateBlock { node: HTMLElement; top: number }

export function clearPageBreaks(inner: HTMLElement) {
	inner.querySelectorAll(`.${SPACER_CLASS}`).forEach(node => node.remove());
	inner.querySelectorAll("[data-page-start]").forEach(node => node.removeAttribute("data-page-start"));
}

/** Measure actual flow distances so collapsed margins are counted only once. */
export function measureResumeBlocks(inner: HTMLElement, pageHeight: number, scale: number): MeasuredBlock[] {
	const origin = inner.getBoundingClientRect().top;
	const nodes = [...inner.querySelectorAll<HTMLElement>("[data-block-id]")].flatMap((node, index, all) => {
		const rect = node.getBoundingClientRect();
		const heading = all[index - 1];
		const keepGap = heading?.dataset.blockKind === "keep" ? rect.top - heading.getBoundingClientRect().top : 0;
		const oversized = (rect.height + keepGap) / scale > pageHeight;
		node.toggleAttribute("data-oversized", oversized);
		if (oversized && node.classList.contains("resume-entry")) {
			const parts = [...node.querySelectorAll<HTMLElement>(":scope > .resume-entry-head, :scope > .resume-bullets > li, :scope > .resume-note")];
			if (parts.length) return parts;
		}
		return [node];
	});
	let bottom = origin;
	return nodes.map((node, index) => {
		const rect = node.getBoundingClientRect();
		const height = Math.max(0, (rect.bottom - bottom) / scale);
		bottom = rect.bottom;
		return { node, id: String(index), top: (rect.top - origin) / scale, height,
			kind: node.dataset.blockKind === "keep" || node.classList.contains("resume-entry-head") ? "keep" : "unit" };
	});
}

export function placePageBreaks(inner: HTMLElement, blocks: MeasuredBlock[], breaks: PageBreak[], pagePadding: number, scale: number) {
	let added = 0;
	for (const item of breaks) {
		const next = blocks[Number(item.afterId) + 1];
		if (!next) continue;
		const spacer = document.createElement(next.node.tagName === "LI" ? "li" : "div");
		spacer.className = SPACER_CLASS;
		spacer.setAttribute("aria-hidden", "true");
		const height = item.height + pagePadding;
		added += height;
		spacer.style.height = `${height}px`;
		next.node.setAttribute("data-page-start", "");
		next.node.before(spacer);
		// Inserting a box can change margin collapsing at a section/list boundary.
		const actual = (next.node.getBoundingClientRect().top - inner.getBoundingClientRect().top) / scale;
		spacer.style.height = `${Math.max(0, height + next.top + added - actual)}px`;
	}
}
