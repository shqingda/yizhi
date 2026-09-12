import { useLayoutEffect, useState, type RefObject } from "react";
import type { LayoutMode } from "@shared/schema";

const PAGE_RATIO = 297 / 210;

export interface ResumeLayoutInfo {
	pageCount: number;
	height: number;
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

		const measure = () => inner.scrollHeight;

		const pageHeight = () => Math.max(1, sheet.clientWidth * PAGE_RATIO);

		const contentBox = () => {
			const style = getComputedStyle(sheet);
			const pad =
				Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
			return Math.max(120, pageHeight() - pad);
		};

		const search = (
			lo: number,
			hi: number,
			fits: (value: number) => boolean,
		) => {
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

		const run = () => {
			if (cancelled || !sheet.isConnected) return;

			if (mode === "single") {
				apply(1, 1);
				void inner.offsetHeight;
				setInfo({ pageCount: 1, height: sheet.scrollHeight });
				return;
			}

			const box = contentBox();
			if (box <= 0) return;
			apply(1, 1);
			void inner.offsetHeight;
			const natural = measure();
			const pages = Math.max(1, Math.ceil(natural / box - 0.02));
			const target = pages * box * 0.94;
			if (natural < target && pages >= 1) {
				const gap = search(1, 1.22, (value) => {
					apply(value, 1);
					void inner.offsetHeight;
					return measure() <= pages * box - 8;
				});
				apply(gap, 1);
				void inner.offsetHeight;
				const afterPages = Math.max(1, Math.ceil(measure() / box - 0.02));
				if (afterPages > pages) {
					apply(1, 1);
					setInfo({ pageCount: pages, height: pages * pageHeight() });
					return;
				}
				setInfo({ pageCount: afterPages, height: afterPages * pageHeight() });
				return;
			}
			setInfo({ pageCount: pages, height: pages * pageHeight() });
		};

		run();

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
		};
	}, [innerRef, mode, revision, sheetRef]);

	return info;
}
