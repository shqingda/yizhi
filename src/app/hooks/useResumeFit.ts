import { useLayoutEffect, useState, type RefObject } from "react";
import { paginateBlocks } from "@shared/paginate";
import type { LayoutMode, Resume } from "@shared/schema";
import { clearPageBreaks, measureResumeBlocks, placePageBreaks } from "@/lib/resumePagination";

const PAGE_RATIO = 297 / 210;

export interface ResumeLayoutInfo {
	pageCount: number;
	overflow?: boolean;
	height: number;
}

function parsePx(value: string) {
	const n = Number.parseFloat(value);
	return Number.isFinite(n) ? n : 0;
}

export function useResumeFit(
	sheetRef: RefObject<HTMLElement | null>,
	innerRef: RefObject<HTMLElement | null>,
	mode: LayoutMode,
	revision: Resume,
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

		const sheetWidth = () => parsePx(getComputedStyle(sheet).width) || sheet.clientWidth;
		const pageHeight = () => Math.max(1, sheetWidth() * PAGE_RATIO);
		const scale = () => sheet.getBoundingClientRect().width / sheetWidth() || 1;

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
			clearPageBreaks(inner);
			void inner.offsetHeight;
			return paginateBlocks(measureResumeBlocks(inner, contentBox(), scale()), contentBox());
		};

		const run = () => {
			if (cancelled || !sheet.isConnected || sheet.clientWidth === 0) return;

			if (mode === "single") {
				clearPageBreaks(inner);
				inner.querySelectorAll("[data-oversized]").forEach(node => node.removeAttribute("data-oversized"));
				apply(1, 1);
				void inner.offsetHeight;
				setInfo({ pageCount: 1, height: sheet.scrollHeight });
				return;
			}

			const box = contentBox();

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

			const blocks = measureResumeBlocks(inner, box, scale());
			placePageBreaks(inner, blocks, result.breaks, pageHeight() - box, scale());
			sheet.style.setProperty("--resume-page-count", String(result.pageCount));
			setInfo({
				pageCount: result.pageCount,
				height: Math.max(result.pageCount * pageHeight(), sheet.scrollHeight),
				overflow: !!inner.querySelector("[data-oversized]"),
			});
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
