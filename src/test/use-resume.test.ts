import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useResume } from "@/hooks/useResume";
import { loadWorkspace, WORKSPACE_KEY } from "@/lib/draftStore";
import { STORAGE_KEY } from "@/lib/storage";
import { SAMPLE_RESUME } from "@shared/seed";
import { normalizeResume } from "@shared/schema";
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });
const edit = (name: string) => (data: typeof SAMPLE_RESUME) => ({ ...data, basics: { ...data.basics, name } });
describe("browser-only drafts", () => {
	it("starts with the example directly and never requests cloud data", async () => {
		const { result } = renderHook(useResume);
		expect(result.current.resume).toEqual(SAMPLE_RESUME); expect(result.current.started).toBe(true);
		await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
		expect(fetch).not.toHaveBeenCalled();
	});
	it("saves edits after 350ms and restores them after remount", async () => {
		const hook = renderHook(useResume);
		act(() => hook.result.current.setResume(edit("Local name")));
		await act(async () => { await vi.advanceTimersByTimeAsync(350); });
		expect(loadWorkspace().drafts[0].data.basics.name).toBe("Local name");
		hook.unmount(); expect(renderHook(useResume).result.current.resume.basics.name).toBe("Local name");
		expect(fetch).not.toHaveBeenCalled();
	});
	it("returns to the example after browser storage is cleared", () => {
		const hook = renderHook(useResume); act(() => hook.result.current.setResume(edit("Custom"))); hook.unmount();
		localStorage.clear(); expect(renderHook(useResume).result.current.resume).toEqual(SAMPLE_RESUME);
	});
	it("retains old local JSON drafts", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(edit("Legacy")(SAMPLE_RESUME)));
		expect(renderHook(useResume).result.current.resume.basics.name).toBe("Legacy");
	});
	it("flushes the last edit when leaving the editor", () => {
		const hook = renderHook(useResume); act(() => hook.result.current.setResume(edit("Last edit"))); hook.unmount();
		expect(loadWorkspace().drafts[0].data.basics.name).toBe("Last edit");
	});
	it("supports undo and durable import recovery", () => {
		const { result } = renderHook(useResume);
		act(() => result.current.setResume(edit("Before import")));
		act(() => result.current.replace(normalizeResume({ basics: { name: "Imported" } })));
		expect(result.current.backups[0].data.basics.name).toBe("Before import");
		act(() => result.current.undo()); expect(result.current.resume.basics.name).toBe("Before import");
		act(() => result.current.redo()); expect(result.current.resume.basics.name).toBe("Imported");
	});
	it("preserves data when storage is full and blocks destructive replacement", () => {
		const { result } = renderHook(useResume);
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
		act(() => { result.current.flushLocal(); }); expect(result.current.localError).not.toBe("");
		act(() => { expect(result.current.replace(normalizeResume({ basics: { name: "Replacement" } }))).toBe(false); });
		expect(result.current.resume).toEqual(SAMPLE_RESUME);
	});
	it("keeps multiple local resumes independent", () => {
		const { result } = renderHook(useResume); const first = result.current.activeId;
		act(() => result.current.setResume(edit("First")));
		act(() => result.current.newDraft("blank")); act(() => result.current.setResume(edit("Second")));
		act(() => result.current.switchDraft(first)); expect(result.current.resume.basics.name).toBe("First");
	});
	it("does not overwrite corrupt browser storage with the example", () => {
		localStorage.setItem(WORKSPACE_KEY, "broken"); const { result } = renderHook(useResume);
		act(() => result.current.flushLocal()); expect(result.current.localError).not.toBe("");
		expect(localStorage.getItem(WORKSPACE_KEY)).toBe("broken");
	});
});
