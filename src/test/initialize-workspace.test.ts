import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDraft, saveWorkspace, WORKSPACE_KEY } from "@/lib/draftStore";
import { SAMPLE_RESUME } from "./fixtures";

beforeEach(() => {
	localStorage.clear();
	vi.resetModules();
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	localStorage.clear();
});

describe("workspace initialization and deferred sample loading", () => {
	it("opens saved drafts without downloading the sample", async () => {
		const draft = createDraft(SAMPLE_RESUME);
		draft.data.basics.name = "Saved";
		saveWorkspace({ version: 2, activeId: draft.id, drafts: [draft] });
		const fetcher = vi.fn();
		vi.stubGlobal("fetch", fetcher);
		const { initializeWorkspace } = await import("@/lib/initializeWorkspace");
		const result = await initializeWorkspace();
		expect(result.workspace.drafts[0].data.basics.name).toBe("Saved");
		expect(result.error).toBe("");
		expect(fetcher).not.toHaveBeenCalled();
	});
	it("loads a self-contained sample for a fresh browser without writing during initialization", async () => {
		const fetcher = vi.fn().mockResolvedValue(Response.json(SAMPLE_RESUME));
		vi.stubGlobal("fetch", fetcher);
		const { initializeWorkspace } = await import("@/lib/initializeWorkspace");
		const result = await initializeWorkspace();
		expect(result.workspace.drafts[0].data).toEqual(SAMPLE_RESUME);
		expect(fetcher).toHaveBeenCalledWith("/sample-resume.json", { signal: expect.any(AbortSignal) });
		expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
	});
	it.each(["", "{broken", "null", JSON.stringify({ version: 2, activeId: "missing", drafts: [] })])(
		"preserves unreadable local data: %s",
		async (raw) => {
			localStorage.setItem(WORKSPACE_KEY, raw);
			const fetcher = vi.fn();
			vi.stubGlobal("fetch", fetcher);
			const { initializeWorkspace } = await import("@/lib/initializeWorkspace");
			expect((await initializeWorkspace()).error).not.toBe("");
			expect(localStorage.getItem(WORKSPACE_KEY)).toBe(raw);
			expect(fetcher).not.toHaveBeenCalled();
		},
	);
	it("reports unavailable storage without falling back to a remote template", async () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new DOMException("Blocked", "SecurityError");
		});
		const fetcher = vi.fn();
		vi.stubGlobal("fetch", fetcher);
		const { initializeWorkspace } = await import("@/lib/initializeWorkspace");
		expect((await initializeWorkspace()).error).not.toBe("");
		expect(fetcher).not.toHaveBeenCalled();
	});
	it("deduplicates sample downloads while giving each caller independent data", async () => {
		const fetcher = vi.fn().mockResolvedValue(Response.json(SAMPLE_RESUME));
		vi.stubGlobal("fetch", fetcher);
		const { loadSampleResume } = await import("@/lib/sampleResume");
		const [first, second] = await Promise.all([loadSampleResume(), loadSampleResume()]);
		first.basics.name = "Changed";
		expect(second).toEqual(SAMPLE_RESUME);
		expect(await loadSampleResume()).toEqual(SAMPLE_RESUME);
		expect(fetcher).toHaveBeenCalledTimes(1);
	});
	it.each(["http", "json", "shape", "network", "timeout"])(
		"allows retry after a %s failure",
		async (failure) => {
			const fetcher = vi.fn();
			if (failure === "network" || failure === "timeout")
				fetcher.mockRejectedValueOnce(
					new DOMException("Failed", failure === "timeout" ? "TimeoutError" : "NetworkError"),
				);
			else
				fetcher.mockResolvedValueOnce(
					failure === "http"
						? new Response("Failed", { status: 503 })
						: failure === "json"
							? new Response("<html>")
							: Response.json({ invalid: true }),
				);
			fetcher.mockResolvedValueOnce(Response.json(SAMPLE_RESUME));
			vi.stubGlobal("fetch", fetcher);
			const { initializeWorkspace } = await import("@/lib/initializeWorkspace");
			await expect(initializeWorkspace()).rejects.toThrow();
			expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
			expect((await initializeWorkspace()).workspace.drafts[0].data).toEqual(SAMPLE_RESUME);
		},
	);
});
