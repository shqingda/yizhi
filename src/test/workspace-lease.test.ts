import { act, cleanup, render, renderHook, waitFor } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { useWorkspace } from "@/hooks/useWorkspace";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceLease } from "@/lib/workspaceLease";
import { initializeWorkspace } from "@/lib/initializeWorkspace";
import { createDraft, loadWorkspace, saveWorkspace, WORKSPACE_KEY } from "@/lib/draftStore";
import { useResume } from "@/hooks/useResume";
import { SAMPLE_RESUME } from "./fixtures";
import * as sampleLoader from "@/lib/sampleResume";

// The lock stays held until its callback settles, just as in another browsing context.
function installLocks() {
 const held = new Set<string>();
 const request = vi.fn(async (name: string, _options: unknown, callback: (lock: object | null) => unknown) => {
  await Promise.resolve();
  if (held.has(name)) return callback(null);
  held.add(name);
  try { return await callback({ name }); }
  finally { held.delete(name); }
 });
 Object.defineProperty(navigator, "locks", { configurable: true, value: { request } });
 return held;
}
const edit = (name: string) => (resume: typeof SAMPLE_RESUME) => ({ ...resume, basics: { ...resume.basics, name } });
async function page() {
 const lease = new WorkspaceLease();
 await lease.acquire();
 const initial = await initializeWorkspace();
 const hook = renderHook(() => useResume(initial, lease));
 return { ...hook, lease };
}
function storageEvent() {
 window.dispatchEvent(new StorageEvent("storage", { key: WORKSPACE_KEY, storageArea: localStorage }));
}
beforeEach(() => {
 installLocks();
 localStorage.clear();
 const draft = createDraft(SAMPLE_RESUME);
 saveWorkspace({ version: 2, activeId: draft.id, drafts: [draft] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe("workspace ownership", () => {
 it("survives StrictMode mounting without leaking or dropping the sole editor lock", async () => {
  function Probe() { const m = useWorkspace(); return createElement("span", null, m.canEdit ? "editor" : m.accessState); }
  const view = render(createElement(StrictMode, null, createElement(WorkspaceProvider, null, createElement(Probe))));
  await waitFor(() => expect(view.getByText("editor")).toBeTruthy());
  const contender = new WorkspaceLease();
  expect(await contender.acquire()).toBe(false);
  view.unmount();
  expect(await contender.acquire()).toBe(true);
  contender.release();
 });
 it("allows only one simultaneous acquisition, and releases only after flushing", async () => {
  const a = new WorkspaceLease(), b = new WorkspaceLease();
  expect(await Promise.all([a.acquire(), b.acquire()])).toEqual([true, false]);
  a.beforeRelease = () => expect(a.owned).toBe(true);
  a.release();
  expect(await b.acquire()).toBe(true);
  b.release();
 });
 it("cancels an in-flight acquisition and can safely acquire again", async () => {
  const lease = new WorkspaceLease();
  const old = lease.acquire();
  lease.release();
  expect(await old).toBe(false);
  expect(await lease.acquire()).toBe(true);
  lease.release();
 });
 it("stays read-only when the browser exposes but denies Web Locks", async () => {
  Object.defineProperty(navigator, "locks", { configurable: true, value: { request: vi.fn().mockRejectedValue(new DOMException("Denied", "SecurityError")) } });
  const raw = localStorage.getItem(WORKSPACE_KEY);
  const current = await page();
  expect(current.result.current.accessState).toBe("unsupported");
  expect(current.result.current.canEdit).toBe(false);
  current.unmount();
  expect(localStorage.getItem(WORKSPACE_KEY)).toBe(raw);
 });
 it("makes every viewer mutation inert, including updater callbacks and lifecycle saves", async () => {
  const writer = await page();
  act(() => { writer.result.current.replace(SAMPLE_RESUME); writer.result.current.flushLocal(); });
  const viewer = await page();
  const raw = localStorage.getItem(WORKSPACE_KEY);
  const update = vi.fn(edit("Not allowed"));
  const remove = vi.fn();
  await act(async () => {
   const m = viewer.result.current;
   m.setResume(update); m.removeWithUndo(remove); m.undo(); m.redo();
   m.rename("Not allowed"); m.removeBackup(m.backups[0].id);
   expect(m.replace(SAMPLE_RESUME)).toBe(false);
   expect(m.restore(m.backups[0].id)).toBe(false);
   expect(m.newDraft("copy")).toBe(false);
   expect(m.switchDraft(m.activeId)).toBe(false);
   expect(await m.resetSample()).toBe(false);
   expect(m.flushLocal()).toBe(false);
   expect(await m.requestEdit()).toBe(false);
  });
  viewer.unmount();
  expect(update).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
  expect(localStorage.getItem(WORKSPACE_KEY)).toBe(raw);
  expect(writer.result.current.canEdit).toBe(true);
 });
 it("follows saved drafts, then rereads the newest snapshot before enabling editing", async () => {
  const writer = await page(), viewer = await page();
  act(() => { writer.result.current.setResume(edit("Saved elsewhere")); writer.result.current.flushLocal(); storageEvent(); });
  expect(viewer.result.current.resume.basics.name).toBe("Saved elsewhere");
  expect(viewer.result.current.localConflict).toBe(false);
  act(() => writer.result.current.setResume(edit("Last edit before closing")));
  writer.unmount();
  await act(async () => { expect(await viewer.result.current.requestEdit()).toBe(true); });
  expect(viewer.result.current.canEdit).toBe(true);
  expect(viewer.result.current.resume.basics.name).toBe("Last edit before closing");
 });
 it("rechecks the lock on bfcache return and cannot save after another page takes ownership", async () => {
  const first = await page();
  act(() => { first.result.current.setResume(edit("Before suspension")); window.dispatchEvent(new Event("pagehide")); });
  expect(first.result.current.canEdit).toBe(false);
  expect(loadWorkspace()!.drafts[0].data.basics.name).toBe("Before suspension");
  const second = await page();
  await act(async () => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  expect(first.result.current.canEdit).toBe(false);
  act(() => first.result.current.setResume(edit("Stale callback")));
  expect(first.result.current.resume.basics.name).toBe("Before suspension");
  second.unmount();
  await act(async () => { expect(await first.result.current.requestEdit()).toBe(true); });
 });
 it("retains unsaved data after quota failure and bfcache, and retries after reacquiring", async () => {
  const first = await page();
  const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
  act(() => { first.result.current.setResume(edit("Unsaved but retained")); window.dispatchEvent(new Event("pagehide")); });
  expect(first.result.current.localError).toContain("保存失败");
  save.mockRestore();
  await act(async () => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  expect(first.result.current.canEdit).toBe(true);
  expect(loadWorkspace()!.drafts[0].data.basics.name).toBe("Unsaved but retained");
 });
 it("preserves an unsaved first workspace whose original storage snapshot was null", async () => {
  localStorage.removeItem(WORKSPACE_KEY);
  localStorage.setItem("resume-studio:draft", JSON.stringify(SAMPLE_RESUME));
  const first = await page();
  const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
  act(() => { first.result.current.setResume(edit("First unsaved draft")); window.dispatchEvent(new Event("pagehide")); });
  save.mockRestore();
  await act(async () => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  expect(loadWorkspace()!.drafts[0].data.basics.name).toBe("First unsaved draft");
 });
 it("does not enable mutation between acquiring the lock and finishing the fresh read", async () => {
  const writer = await page(), viewer = await page(); writer.unmount();
  localStorage.clear();
  let resolve!: (value: typeof SAMPLE_RESUME) => void;
  vi.spyOn(sampleLoader, "loadSampleResume").mockReturnValue(new Promise(done => { resolve = done; }));
  let requesting!: Promise<boolean>;
  await act(async () => { requesting = viewer.result.current.requestEdit(); });
  expect(viewer.lease.owned).toBe(true);
  expect(viewer.result.current.canEdit).toBe(false);
  const update = vi.fn(edit("Premature edit"));
  act(() => viewer.result.current.setResume(update)); expect(update).not.toHaveBeenCalled();
  await act(async () => { resolve(SAMPLE_RESUME); expect(await requesting).toBe(true); });
  expect(viewer.result.current.canEdit).toBe(true);
  expect(viewer.result.current.resume.basics.name).toBe(SAMPLE_RESUME.basics.name);
 });
 it("does not overwrite a legacy writer when resuming unsaved work", async () => {
  const first = await page();
  const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
  act(() => { first.result.current.setResume(edit("Keep for backup")); window.dispatchEvent(new Event("pagehide")); });
  save.mockRestore();
  const remote = loadWorkspace()!; remote.drafts[0].data.basics.name = "Legacy writer"; saveWorkspace(remote);
  await act(async () => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  expect(first.result.current.localConflict).toBe(true);
  expect(first.result.current.resume.basics.name).toBe("Keep for backup");
  expect(loadWorkspace()!.drafts[0].data.basics.name).toBe("Legacy writer");
 });
 it("offers read-only data when Web Locks is unavailable, without migrating storage on read", async () => {
  Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  localStorage.removeItem(WORKSPACE_KEY);
  localStorage.setItem("resume-studio:draft", JSON.stringify(SAMPLE_RESUME));
  const viewer = await page();
  expect(viewer.result.current.accessState).toBe("unsupported");
  await act(async () => { expect(await viewer.result.current.requestEdit()).toBe(false); });
  viewer.unmount();
  expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();
  expect(localStorage.length).toBe(1);
 });
 it("does not enable or overwrite corrupt records even while owning the lock", async () => {
  localStorage.setItem(WORKSPACE_KEY, "broken");
  // A corrupt record uses the fetched example only as a safe preview.
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE_RESUME }));
  const current = await page();
  expect(current.result.current.canEdit).toBe(false);
  act(() => current.result.current.setResume(edit("Do not write")));
  current.unmount();
  expect(localStorage.getItem(WORKSPACE_KEY)).toBe("broken");
  vi.unstubAllGlobals();
 });
});
