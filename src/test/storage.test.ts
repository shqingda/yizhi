import { emptyResume } from "@shared/schema";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_RESUME } from "./fixtures";
import { SIDEBAR_KEY, STORAGE_KEY, readLocalValue, writeLocalValue } from "@/lib/storage";
import {
	createDraft,
	loadWorkspace,
	restoreRemoved,
	saveWorkspace,
	withBackup,
	WORKSPACE_KEY,
} from "@/lib/draftStore";

afterEach(() => {
	vi.restoreAllMocks();
	localStorage.clear();
});

describe("workspace storage and legacy migration", () => {
	it.each(["duplicate id", "missing current", "invalid draft", "invalid recovery"])(
		"preserves a workspace with %s instead of silently dropping data",
		(problem) => {
			const draft = createDraft(emptyResume());
			const workspace = { version: 2, activeId: draft.id, drafts: [draft] };
			if (problem === "duplicate id") workspace.drafts.push(structuredClone(draft));
			if (problem === "missing current") workspace.activeId = "missing";
			if (problem === "invalid draft") Object.assign(draft, { data: null });
			if (problem === "invalid recovery") Object.assign(draft, { backups: [{ id: "b", data: null }] });
			const raw = JSON.stringify(workspace);
			localStorage.setItem(WORKSPACE_KEY, raw);
			expect(() => loadWorkspace()).toThrow();
			expect(localStorage.getItem(WORKSPACE_KEY)).toBe(raw);
		},
	);
	it("returns null without fabricating a draft when storage is empty", () => {
		expect(loadWorkspace()).toBeNull();
	});
	it.each([STORAGE_KEY, "resume-studio:draft"])("restores the legacy draft in %s", (key) => {
		const data = { ...SAMPLE_RESUME, basics: { ...SAMPLE_RESUME.basics, name: "旧草稿" } };
		localStorage.setItem(key, JSON.stringify(data));
		const workspace = loadWorkspace()!;
		expect(workspace.drafts[0].data).toEqual(data);
		saveWorkspace(workspace);
		expect(loadWorkspace()).toEqual(workspace);
		expect(localStorage.getItem(key)).toBe(JSON.stringify(data));
	});
	it("prefers the current workspace over older keys", () => {
		const draft = createDraft(emptyResume());
		draft.data.basics.name = "Current";
		saveWorkspace({ version: 2, activeId: draft.id, drafts: [draft] });
		localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_RESUME));
		expect(loadWorkspace()!.drafts[0].data.basics.name).toBe("Current");
	});
	it("reads a legacy draft when copying it exceeds storage quota", () => {
		localStorage.setItem("resume-studio:draft", JSON.stringify(SAMPLE_RESUME));
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new DOMException("Quota exceeded", "QuotaExceededError");
		});
		expect(loadWorkspace()!.drafts[0].data).toEqual(SAMPLE_RESUME);
	});
	it("does not replace malformed records", () => {
		localStorage.setItem(WORKSPACE_KEY, "broken");
		expect(() => loadWorkspace()).toThrow();
		expect(localStorage.getItem(WORKSPACE_KEY)).toBe("broken");
	});
	it("uses the same preference key when migration fails, then migrates the latest value", () => {
		localStorage.setItem("resume-studio:sidebar", "0");
		const setItem = Storage.prototype.setItem;
		const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
			this: Storage,
			name,
			value,
		) {
			if (name === SIDEBAR_KEY) throw new DOMException("Quota exceeded", "QuotaExceededError");
			setItem.call(this, name, value);
		});
		expect(readLocalValue(SIDEBAR_KEY)).toBe("0");
		writeLocalValue(SIDEBAR_KEY, "1");
		expect(readLocalValue(SIDEBAR_KEY)).toBe("1");
		spy.mockRestore();
		expect(readLocalValue(SIDEBAR_KEY)).toBe("1");
		expect(localStorage.getItem(SIDEBAR_KEY)).toBe("1");
	});
});

describe("workspace recovery", () => {
	it("keeps only five recovery points and preserves originals on quota failure", () => {
		const draft = createDraft(emptyResume());
		let workspace = { version: 2 as const, activeId: draft.id, drafts: [draft] };
		for (let i = 0; i < 7; i++) workspace = withBackup(workspace, draft.id, `point ${i}`);
		expect(workspace.drafts[0].backups.map((b) => b.label)).toEqual([
			"point 6",
			"point 5",
			"point 4",
			"point 3",
			"point 2",
		]);
		saveWorkspace(workspace);
		const before = localStorage.getItem("yizhi:workspace:v2");
		workspace.drafts[0].backups[0].data.basics.photo = "x".repeat(1_100_000);
		expect(() => saveWorkspace(workspace)).toThrow();
		expect(localStorage.getItem("yizhi:workspace:v2")).toBe(before);
	});
	it("undoes deletion without discarding subsequent text changes or new records", () => {
		const before = emptyResume();
		before.skills = [
			{ id: "a", name: "A", keywords: "" },
			{ id: "b", name: "B", keywords: "" },
		];
		const after = { ...before, skills: [before.skills[1]] };
		const current = {
			...after,
			basics: { ...after.basics, name: "New name" },
			skills: [
				{ ...before.skills[1], keywords: "Edited" },
				{ id: "c", name: "New", keywords: "" },
			],
		};
		const restored = restoreRemoved(before, after, current);
		expect(restored.basics.name).toBe("New name");
		expect(restored.skills.map((s) => s.id)).toEqual(["a", "b", "c"]);
		expect(restored.skills[1].keywords).toBe("Edited");
	});
});
