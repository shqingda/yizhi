import { describe, expect, it } from "vitest";
import { paginateBlocks, peekHeight, type PaginateBlock } from "@shared/paginate";

function unit(id: string, height: number): PaginateBlock {
	return { id, height, kind: "unit" };
}

function keep(id: string, height: number): PaginateBlock {
	return { id, height, kind: "keep" };
}

describe("peekHeight", () => {
	it("adds the next block when the current one is keep-with-next", () => {
		const blocks = [keep("h", 10), unit("e", 40)];
		expect(peekHeight(blocks, 0)).toBe(50);
		expect(peekHeight(blocks, 1)).toBe(40);
	});
});

describe("paginateBlocks", () => {
	it("returns a single empty page when there is nothing to pack", () => {
		expect(paginateBlocks([], 100)).toEqual({ pageCount: 1, breaks: [], lastPageUsed: 0 });
		expect(paginateBlocks([unit("a", 10)], 0).pageCount).toBe(1);
	});

	it("keeps blocks that fit on one page", () => {
		const result = paginateBlocks([unit("a", 30), unit("b", 40)], 100);
		expect(result.pageCount).toBe(1);
		expect(result.breaks).toEqual([]);
		expect(result.lastPageUsed).toBe(70);
	});

	it("inserts a spacer after the last block that fit", () => {
		const result = paginateBlocks([unit("a", 60), unit("b", 60)], 100);
		expect(result.pageCount).toBe(2);
		expect(result.breaks).toEqual([{ afterId: "a", height: 40 }]);
		expect(result.lastPageUsed).toBe(60);
	});

	it("moves a heading to the next page instead of leaving it hanging", () => {
		const result = paginateBlocks([unit("prev", 80), keep("h", 12), unit("e", 30)], 100);
		expect(result.pageCount).toBe(2);
		expect(result.breaks).toEqual([{ afterId: "prev", height: 20 }]);
		expect(result.lastPageUsed).toBe(42);
	});

	it("keeps a heading with its first entry when they fit the current page", () => {
		const result = paginateBlocks([unit("prev", 40), keep("h", 10), unit("e", 20)], 100);
		expect(result.pageCount).toBe(1);
		expect(result.breaks).toEqual([]);
		expect(result.lastPageUsed).toBe(70);
	});

	it("accounts for oversized blocks across pages and uses the remaining space", () => {
		const result = paginateBlocks([unit("huge", 140), unit("tail", 20)], 100);
		expect(result.pageCount).toBe(2);
		expect(result.breaks).toEqual([]);
		expect(result.lastPageUsed).toBe(60);
	});
});

it("counts every page in a final oversized block and keeps its heading attached", () => {
	const result = paginateBlocks([keep("h", 10), unit("huge", 340)], 100);
	expect(result.pageCount).toBe(4); expect(result.breaks).toEqual([]); expect(result.lastPageUsed).toBe(50);
});
