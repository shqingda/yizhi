import { useLayoutEffect, useState, type RefObject } from "react";
import { paginateBlocks, type PaginateBlock, type PageBreak } from "@shared/paginate";
import type { LayoutMode } from "@shared/schema";

const PAGE_RATIO = 297 / 210;
const SPACER_CLASS = "resume-page-spacer";

export interface ResumeLayoutInfo {
	pageCount: number;
	overflow?: boolean;
	height: number;
}

function parsePx(value: string) {
	const n = Number.parseFloat(value);
	return Number.isFinite(n) ? n : 0;
}

function clearSpacers(inner: HTMLElement) {
	inner.querySelectorAll(`.${SPACER_CLASS}`).forEach((node) => node.remove());
}

function applySpacers(inner: HTMLElement, breaks: readonly PageBreak[]) {
	clearSpacers(inner);
	for (const item of breaks) {
		const el = inner.querySelector(`[data-block-id="${CSS.escape(item.afterId)}"]`);
		if (!el) continue;
		const spacer = document.createElement("div");
		spacer.className = SPACER_CLASS;
		spacer.setAttribute("aria-hidden", "true");
		spacer.style.height = `${Math.max(0, item.height)}px`;
		el.after(spacer);
	}
}

function measureBlocks(inner: HTMLElement): PaginateBlock[] {
	return [...inner.querySelectorAll<HTMLElement>("[data-block-id]")]
		.map((node) => {
			const style = getComputedStyle(node);
			let height = node.offsetHeight + parsePx(style.marginTop) + parsePx(style.marginBottom);
			const parent = node.parentElement;
			if (parent?.classList.contains("resume-section") && parent.firstElementChild === node) {
				const parentStyle = getComputedStyle(parent);
				height += parsePx(parentStyle.marginTop) + parsePx(parentStyle.marginBottom);
			}
			return {
				id: node.dataset.blockId ?? "",
				height,
				kind: node.dataset.blockKind === "keep" ? "keep" : "unit",
			} satisfies PaginateBlock;
		})
		.filter((block) => block.id);
}

export function useResumeFit(
	sheetRef: RefObject<HTMLElement | null>,
	innerRef: RefObject<HTMLElement | null>,
	mode: LayoutMode,
	revision: string,
): ResumeLayoutInfo {
	const [info, setInfo] = useState<ResumeLayoutInfo>({ pageCount: 1, height: 0 });

	useLayoutEffect(() => {
		const sheet = sheetRef.current;
		const inner = innerRef.current;
		if (!sheet || !inner) return;

		let cancelled = false;
		let lastWidth = 0;

		const apply = (gapFit: number, typeFit: number) => {
			sheet.style.setProperty("--resume-gap-fit", gapFit.toFixed(4));
			sheet.style.setProperty("--resume-type-fit", typeFit.toFixed(4));
		};

		const pageHeight = () => Math.max(1, sheet.clientWidth * PAGE_RATIO);

		const contentBox = () => {
			const style = getComputedStyle(sheet);
			const pad = parsePx(style.paddingTop) + parsePx(style.paddingBottom);
			return Math.max(120, pageHeight() - pad);
		};

		const search = (lo: number, hi: number, fits: (value: number) => boolean) => {
			let best = lo;
			for (let i = 0; i < 9; i += 1) {
				const mid = (lo + hi) / 2;
				if (fits(mid)) {
					best = mid;
					lo = mid;
				} else {
					hi = mid;
				}
			}
			return best;
		};

		const pack = () => {
			clearSpacers(inner);
			void inner.offsetHeight;
			return paginateBlocks(measureBlocks(inner), contentBox());
		};

		const run = () => {
			if (cancelled || !sheet.isConnected || sheet.clientWidth === 0) return;

			if (mode === "single") {
				clearSpacers(inner);
				apply(1, 1);
				void inner.offsetHeight;
				setInfo({ pageCount: 1, height: sheet.scrollHeight });
				return;
			}

			const box = contentBox();
			if (box <= 0) return;

			apply(1, 1);
			let result = pack();

			if (result.lastPageUsed > 0 && result.lastPageUsed < box * 0.88) {
				const pages = result.pageCount;
				const gap = search(1, 1.22, (value) => {
					apply(value, 1);
					const next = pack();
					return next.pageCount <= pages;
				});
				apply(gap, 1);
				result = pack();
				if (result.pageCount > pages) {
					apply(1, 1);
					result = pack();
				}
			}

			for (const node of inner.querySelectorAll<HTMLElement>("[data-block-id]")) node.toggleAttribute("data-oversized", node.offsetHeight > box);
			applySpacers(inner, result.breaks);
			setInfo({ pageCount: result.pageCount, height: Math.max(result.pageCount * pageHeight(), sheet.scrollHeight), overflow: measureBlocks(inner).some(block => block.height > box) });
		};

		run();
		inner.addEventListener("load", run, true);
		inner.addEventListener("error", run, true);

		const observer = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width ?? 0;
			if (Math.abs(width - lastWidth) < 0.75) return;
			lastWidth = width;
			run();
		});
		observer.observe(sheet);
		void document.fonts?.ready.then(() => {
			if (!cancelled) run();
		});

		return () => {
			cancelled = true;
			observer.disconnect();
			inner.removeEventListener("load", run, true);
			inner.removeEventListener("error", run, true);
		};
	}, [innerRef, mode, revision, sheetRef]);

	return info;
}
