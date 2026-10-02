import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResume } from "@/hooks/useResume";
import { createDraft, loadWorkspace, WORKSPACE_KEY } from "@/lib/draftStore";
import { STORAGE_KEY } from "@/lib/storage";
import { SAMPLE_RESUME } from "./fixtures";
import { normalizeResume } from "@shared/schema";
import * as sampleLoader from "@/lib/sampleResume";
beforeEach(() => {
	localStorage.clear();
	vi.useFakeTimers();
	vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
	localStorage.clear();
});
const edit = (name: string) => (data: typeof SAMPLE_RESUME) => ({
	...data,
	basics: { ...data.basics, name },
});
function renderResume() {
	const fallback = createDraft(SAMPLE_RESUME);
	let workspace = { version: 2 as const, activeId: fallback.id, drafts: [fallback] };
	let error = "";
	try {
		workspace = loadWorkspace() ?? workspace;
	} catch {
		error = "无法读取本机草稿";
	}
	return renderHook(() => useResume({ workspace, error }));
}
describe("browser-only drafts", () => {
	it("does not reset a different draft after a delayed sample download", async () => {
		let resolve!: (value: typeof SAMPLE_RESUME) => void;
		vi.spyOn(sampleLoader, "loadSampleResume").mockReturnValue(
			new Promise((done) => {
				resolve = done;
			}),
		);
		const { result } = renderResume();
		let resetting!: Promise<boolean>;
		act(() => {
			resetting = result.current.resetSample();
		});
		act(() => {
			result.current.newDraft("blank");
			result.current.setResume(edit("Keep this"));
		});
		await act(async () => {
			resolve(SAMPLE_RESUME);
			expect(await resetting).toBe(false);
		});
		expect(result.current.resume.basics.name).toBe("Keep this");
	});
	it("preserves edits made while a reset sample is loading", async () => {
		let resolve!: (value: typeof SAMPLE_RESUME) => void;
		vi.spyOn(sampleLoader, "loadSampleResume").mockReturnValue(
			new Promise((done) => {
				resolve = done;
			}),
		);
		const { result } = renderResume();
		let resetting!: Promise<boolean>;
		act(() => {
			resetting = result.current.resetSample();
			result.current.setResume(edit("New edit"));
		});
		await act(async () => {
			resolve(SAMPLE_RESUME);
			expect(await resetting).toBe(false);
		});
		expect(result.current.resume.basics.name).toBe("New edit");
	});
	it("backs up the current draft before an asynchronous reset", async () => {
		vi.spyOn(sampleLoader, "loadSampleResume").mockResolvedValue(SAMPLE_RESUME);
		const { result } = renderResume();
		act(() => result.current.setResume(edit("Before reset")));
		await act(async () => {
			expect(await result.current.resetSample()).toBe(true);
		});
		expect(result.current.resume).toEqual(SAMPLE_RESUME);
		expect(result.current.backups[0].data.basics.name).toBe("Before reset");
	});
	it("starts with the example directly and never requests cloud data", async () => {
		const { result } = renderResume();
		expect(result.current.resume).toEqual(SAMPLE_RESUME);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(fetch).not.toHaveBeenCalled();
	});
	it("saves edits after 350ms and restores them after remount", async () => {
		const hook = renderResume();
		act(() => hook.result.current.setResume(edit("Local name")));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(350);
		});
		expect(loadWorkspace()!.drafts[0].data.basics.name).toBe("Local name");
		hook.unmount();
		expect(renderResume().result.current.resume.basics.name).toBe("Local name");
		expect(fetch).not.toHaveBeenCalled();
	});
	it("returns to the example after browser storage is cleared", () => {
		const hook = renderResume();
		act(() => hook.result.current.setResume(edit("Custom")));
		hook.unmount();
		localStorage.clear();
		expect(renderResume().result.current.resume).toEqual(SAMPLE_RESUME);
	});
	it("retains old local JSON drafts", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(edit("Legacy")(SAMPLE_RESUME)));
		expect(renderResume().result.current.resume.basics.name).toBe("Legacy");
	});
	it("flushes the last edit when leaving the editor", () => {
		const hook = renderResume();
		act(() => hook.result.current.setResume(edit("Last edit")));
		hook.unmount();
		expect(loadWorkspace()!.drafts[0].data.basics.name).toBe("Last edit");
	});
	it("supports undo and durable import recovery", () => {
		const { result } = renderResume();
		act(() => result.current.setResume(edit("Before import")));
		act(() => result.current.replace(normalizeResume({ basics: { name: "Imported" } })));
		expect(result.current.backups[0].data.basics.name).toBe("Before import");
		act(() => result.current.undo());
		expect(result.current.resume.basics.name).toBe("Before import");
		act(() => result.current.redo());
		expect(result.current.resume.basics.name).toBe("Imported");
	});
	it("preserves data when storage is full and blocks destructive replacement", () => {
		const { result } = renderResume();
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("QuotaExceededError");
		});
		act(() => {
			result.current.flushLocal();
		});
		expect(result.current.localError).not.toBe("");
		act(() => {
			expect(result.current.replace(normalizeResume({ basics: { name: "Replacement" } }))).toBe(false);
		});
		expect(result.current.resume).toEqual(SAMPLE_RESUME);
	});
	it("keeps multiple local resumes independent", () => {
		const { result } = renderResume();
		const first = result.current.activeId;
		act(() => result.current.setResume(edit("First")));
		act(() => result.current.newDraft("blank"));
		act(() => result.current.setResume(edit("Second")));
		act(() => result.current.switchDraft(first));
		expect(result.current.resume.basics.name).toBe("First");
	});
	it("does not overwrite corrupt browser storage with the example", () => {
		localStorage.setItem(WORKSPACE_KEY, "broken");
		const { result } = renderResume();
		act(() => result.current.flushLocal());
		expect(result.current.localError).not.toBe("");
		expect(localStorage.getItem(WORKSPACE_KEY)).toBe("broken");
	});
});
