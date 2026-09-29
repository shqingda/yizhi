export type PaginateKind = "unit" | "keep";

export interface PaginateBlock {
	id: string;
	height: number;
	kind: PaginateKind;
}

export interface PageBreak {
	afterId: string;
	height: number;
}

export interface PaginateResult {
	pageCount: number;
	breaks: PageBreak[];
	lastPageUsed: number;
}

const EPS = 0.5;

/** How much vertical room a block claims, including a keep-with-next neighbor. */
export function peekHeight(blocks: readonly PaginateBlock[], index: number): number {
	const block = blocks[index];
	if (!block) return 0;
	if (block.kind === "keep" && blocks[index + 1]) {
		return block.height + blocks[index + 1].height;
	}
	return block.height;
}

/**
 * Pack measured resume blocks into A4 pages.
 * Headings (`keep`) stay with the next entry so they do not hang at a page foot.
 */
export function paginateBlocks(
	blocks: readonly PaginateBlock[],
	pageHeight: number,
): PaginateResult {
	if (pageHeight <= 0 || blocks.length === 0) {
		return { pageCount: 1, breaks: [], lastPageUsed: 0 };
	}

	const breaks: PageBreak[] = [];
	let pageCount = 1;
	let used = 0;

	for (let i = 0; i < blocks.length; i += 1) {
		const block = blocks[i];
		const needed = peekHeight(blocks, i);
		if (used > 0 && used + needed > pageHeight + EPS && blocks[i - 1]?.kind !== "keep") {
			breaks.push({
				afterId: blocks[i - 1].id,
				height: Math.max(0, pageHeight - used),
			});
			pageCount += 1;
			used = 0;
		}

		used += block.height;

		if (used > pageHeight + EPS) {
			// A very tall entry can span several pages; keep its remaining space
			// available to the next entry instead of inventing an extra break.
			const extraPages = Math.floor((used - EPS) / pageHeight);
			pageCount += extraPages;
			used -= extraPages * pageHeight;
		}
	}

	return { pageCount, breaks, lastPageUsed: used };
}
