import { renderHook, act, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useVisualViewport } from "@/hooks/useVisualViewport";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("keyboard viewport", () => {
	it("uses the visible height for keyboards, preserves pinch zoom, and cleans up", () => {
		const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
		vi.stubGlobal("visualViewport", viewport);
		let nextFrame: FrameRequestCallback = () => {};
		vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { nextFrame = callback; return 1; });
		vi.stubGlobal("cancelAnimationFrame", vi.fn());
		const { unmount } = renderHook(useVisualViewport);
		act(() => nextFrame(0));
		expect(document.documentElement.style.getPropertyValue("--visible-height")).toBe("800px");
		viewport.height = 360;
		act(() => { viewport.dispatchEvent(new Event("resize")); nextFrame(0); });
		expect(document.documentElement.style.getPropertyValue("--visible-height")).toBe("360px");
		viewport.scale = 2; viewport.height = 180;
		act(() => { viewport.dispatchEvent(new Event("resize")); nextFrame(0); });
		expect(document.documentElement.style.getPropertyValue("--visible-height")).toBe("360px");
		unmount(); expect(document.documentElement.style.getPropertyValue("--visible-height")).toBe("");
	});
});
