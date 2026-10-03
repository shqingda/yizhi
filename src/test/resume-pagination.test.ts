import { afterEach, expect, it, vi } from "vitest";
import { clearPageBreaks, measureResumeBlocks, placePageBreaks } from "@/lib/resumePagination";
import { paginateBlocks } from "@shared/paginate";

/** Recorded flow rectangles stand in for browser layout, including collapsed margins. */
function layout(html: string, scale = 1) {
	document.body.innerHTML = `<div class="resume-inner">${html}</div>`;
	const inner = document.querySelector<HTMLElement>(".resume-inner")!;
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function(this: HTMLElement) {
		let top = Number(this.dataset.top ?? 0);
		if (this !== inner) for (const spacer of inner.querySelectorAll<HTMLElement>(".resume-page-spacer")) {
			if (spacer.compareDocumentPosition(this) & Node.DOCUMENT_POSITION_FOLLOWING) top += parseFloat(spacer.style.height);
		}
		const height = Number(this.dataset.height ?? 0);
		return { top: top * scale, bottom: (top + height) * scale, height: height * scale,
			width: 200 * scale, left: 0, right: 200 * scale, x: 0, y: top * scale, toJSON() {} };
	});
	return inner;
}
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

it.each([1, 0.5])("counts collapsed margins once at preview scale %s", scale => {
	const inner = layout(`<header data-block-id="a" data-height="20" style="margin-bottom:15px"></header>
		<section style="margin-top:15px"><div data-block-id="h" data-block-kind="keep" data-top="35" data-height="10"></div>
		<div data-block-id="b" data-top="50" data-height="20"></div></section>`, scale);
	const blocks = measureResumeBlocks(inner, 100, scale);
	expect(blocks.map(b => b.height)).toEqual([20, 25, 25]);
	expect(paginateBlocks(blocks, 100).lastPageUsed).toBe(70);
});

it("splits an oversized experience between bullets and adds page margins at each break", () => {
	const inner = layout(`<header data-block-id="basics" data-height="20"></header>
		<div data-block-id="heading" data-block-kind="keep" data-top="20" data-height="10"></div>
		<div class="resume-entry" data-block-id="experience" data-top="30" data-height="130">
		<div class="resume-entry-head" data-top="30" data-height="10">Company</div><ul class="resume-bullets">
		<li data-top="40" data-height="30">One</li><li data-top="70" data-height="30">Two</li>
		<li data-top="100" data-height="30">Three</li><li data-top="130" data-height="30">Four</li></ul></div>`);
	const blocks = measureResumeBlocks(inner, 100, 1);
	const result = paginateBlocks(blocks, 100);
	expect(result.pageCount).toBe(2);
	expect(result.breaks).toHaveLength(1);
	expect(blocks.slice(1, 3).map(b => b.kind)).toEqual(["keep", "keep"]);
	placePageBreaks(inner, blocks, result.breaks, 20, 1);
	const spacer = inner.querySelector<HTMLElement>(".resume-page-spacer")!;
	expect(spacer.tagName).toBe("LI");
	expect(spacer.nextElementSibling).toHaveTextContent("Three");
	expect(spacer.nextElementSibling).toHaveAttribute("data-page-start");
	expect(spacer).toHaveStyle({ height: "20px" });
	expect(spacer.nextElementSibling!.getBoundingClientRect().top).toBe(120);
	expect(inner.querySelector(".resume-entry")).toHaveAttribute("data-oversized");
	clearPageBreaks(inner);
	expect(inner.querySelectorAll("li")).toHaveLength(4);
	expect(inner.querySelectorAll(".resume-page-spacer")).toHaveLength(0);
	expect(inner.querySelectorAll("[data-page-start]")).toHaveLength(0);
});

it("leaves ordinary entries intact and measures a giant paragraph as overflow", () => {
	const inner = layout(`<div data-block-id="short" class="resume-entry" data-height="40"><div class="resume-entry-head">Short</div></div>
		<div data-block-id="long" class="resume-entry" data-top="40" data-height="240"><p class="resume-note" data-top="40" data-height="240">Long</p></div>`);
	const blocks = measureResumeBlocks(inner, 100, 1);
	expect(blocks).toHaveLength(2);
	expect(blocks[0].node.dataset.blockId).toBe("short");
	expect(blocks[1].height).toBe(240);
	expect(paginateBlocks(blocks, 100).pageCount).toBe(4);
});
