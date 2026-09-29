import { afterEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_RESUME } from "@shared/seed";
import {
	SIDEBAR_KEY,
	readLocalValue,
	writeLocalValue,
	SLUG_KEY,
	STORAGE_KEY,
	loadLocalResume,
	loadLocalSlug,
	saveLocalResume,
	saveLocalSlug,
} from "@/lib/storage";

afterEach(() => {
	localStorage.clear();
});

describe("resume draft", () => {
	it("returns the sample when nothing is stored", () => {
		expect(loadLocalResume().basics.name).toBe(SAMPLE_RESUME.basics.name);
	});

	it("returns the sample when stored JSON is invalid", () => {
		localStorage.setItem(STORAGE_KEY, "{not-json");
		expect(loadLocalResume().basics.name).toBe(SAMPLE_RESUME.basics.name);
	});

	it("round-trips a saved draft", () => {
		const draft = {
			...SAMPLE_RESUME,
			basics: { ...SAMPLE_RESUME.basics, label: "全栈工程师" },
		};
		saveLocalResume(draft);
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "")).toMatchObject({
			basics: { label: "全栈工程师" },
		});
		expect(loadLocalResume().basics.label).toBe("全栈工程师");
	});
});

describe("slug", () => {
	it("defaults to shqingda", () => {
		expect(loadLocalSlug()).toBe("shqingda");
	});

	it("persists a custom slug", () => {
		saveLocalSlug("ada");
		expect(localStorage.getItem(SLUG_KEY)).toBe("ada");
		expect(loadLocalSlug()).toBe("ada");
	});
});

describe("project rename storage migration", () => {
	it("copies a legacy draft and slug while retaining the originals", () => {
		const draft = { ...SAMPLE_RESUME, basics: { ...SAMPLE_RESUME.basics, name: "旧草稿" } };
		const raw = JSON.stringify(draft);
		localStorage.setItem("resume-studio:draft", raw);
		localStorage.setItem("resume-studio:slug", "legacy-slug");
		expect(loadLocalResume().basics.name).toBe("旧草稿");
		expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
		expect(localStorage.getItem("resume-studio:draft")).toBe(raw);
		expect(loadLocalSlug()).toBe("legacy-slug");
		expect(localStorage.getItem(SLUG_KEY)).toBe("legacy-slug");
	});

	it("preserves new values when both names exist", () => {
		localStorage.setItem("resume-studio:slug", "old");
		saveLocalSlug("new");
		expect(loadLocalSlug()).toBe("new");
	});

	it("migrates the collapsed sidebar preference", () => {
		localStorage.setItem("resume-studio:sidebar", "0");
		expect(readLocalValue(SIDEBAR_KEY)).toBe("0");
		expect(localStorage.getItem(SIDEBAR_KEY)).toBe("0");
	});

	it("reads a legacy draft even when migration cannot write", () => {
		localStorage.setItem("resume-studio:draft", JSON.stringify({
			...SAMPLE_RESUME, basics: { ...SAMPLE_RESUME.basics, name: "未丢失" },
		}));
		const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new DOMException("Quota exceeded", "QuotaExceededError");
		});
		try {
			expect(loadLocalResume().basics.name).toBe("未丢失");
		} finally {
			spy.mockRestore();
		}
	});
});


describe("saving after a quota-limited migration", () => {
	it("saves large legacy drafts and migrates the latest edit when space becomes available", () => {
		const draft = structuredClone(SAMPLE_RESUME);
		draft.basics.photo = "data:image/png;base64," + "A".repeat(2_600_000);
		localStorage.setItem("resume-studio:draft", JSON.stringify(draft));

		const edited = loadLocalResume();
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		edited.basics.name = "编辑后";
		expect(() => saveLocalResume(edited)).not.toThrow();
		expect(loadLocalResume().basics.name).toBe("编辑后");
		expect(loadLocalResume().basics.photo).toBe(draft.basics.photo);

		// Updating the old key with a smaller draft frees space for migration.
		delete edited.basics.photo;
		saveLocalResume(edited);
		expect(loadLocalResume().basics.name).toBe("编辑后");
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).basics.name).toBe("编辑后");
		edited.basics.name = "迁移后";
		saveLocalResume(edited);
		expect(loadLocalResume().basics.name).toBe("迁移后");
	});

	it.each([
		[SLUG_KEY, "resume-studio:slug", "old-slug", "new-slug"],
		[SIDEBAR_KEY, "resume-studio:sidebar", "0", "1"],
	] as const)("keeps reads and writes consistent for %s when copying fails", (key, legacyKey, oldValue, newValue) => {
		localStorage.setItem(legacyKey, oldValue);
		const setItem = Storage.prototype.setItem;
		const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, name, value) {
			if (name === key) throw new DOMException("Quota exceeded", "QuotaExceededError");
			setItem.call(this, name, value);
		});
		try {
			expect(readLocalValue(key)).toBe(oldValue);
			writeLocalValue(key, newValue);
			expect(readLocalValue(key)).toBe(newValue);
		} finally {
			spy.mockRestore();
		}
		expect(readLocalValue(key)).toBe(newValue);
		expect(localStorage.getItem(key)).toBe(newValue);
	});

	it("reports failed writes and preserves the last saved legacy draft", () => {
		const draft = structuredClone(SAMPLE_RESUME);
		draft.basics.photo = "A".repeat(2_600_000);
		localStorage.setItem("resume-studio:draft", JSON.stringify(draft));
		const edited = loadLocalResume();
		edited.basics.photo = "A".repeat(5_100_000);
		expect(() => saveLocalResume(edited)).toThrow();
		expect(loadLocalResume().basics.photo).toBe(draft.basics.photo);
	});
});

import { blankResume, createDraft, restoreRemoved, saveWorkspace, withBackup } from "@/lib/draftStore";
describe("workspace recovery", () => {
	it("keeps only five recovery points and preserves originals on quota failure", () => {
		const draft = createDraft(blankResume()); let workspace = { version: 2 as const, started: true, activeId: draft.id, drafts: [draft] };
		for (let i = 0; i < 7; i++) workspace = withBackup(workspace, draft.id, `point ${i}`);
		expect(workspace.drafts[0].backups.map(b => b.label)).toEqual(["point 6", "point 5", "point 4", "point 3", "point 2"]);
		saveWorkspace(workspace); const before = localStorage.getItem("yizhi:workspace:v2");
		workspace.drafts[0].backups[0].data.basics.photo = "x".repeat(1_100_000);
		expect(() => saveWorkspace(workspace)).toThrow(); expect(localStorage.getItem("yizhi:workspace:v2")).toBe(before);
	});
	it("undoes deletion without discarding subsequent text changes or new records", () => {
		const before = blankResume(); before.skills = [{ id: "a", name: "A", keywords: "" }, { id: "b", name: "B", keywords: "" }];
		const after = { ...before, skills: [before.skills[1]] };
		const current = { ...after, basics: { ...after.basics, name: "New name" }, skills: [{ ...before.skills[1], keywords: "Edited" }, { id: "c", name: "New", keywords: "" }] };
		const restored = restoreRemoved(before, after, current);
		expect(restored.basics.name).toBe("New name"); expect(restored.skills.map(s => s.id)).toEqual(["a", "b", "c"]); expect(restored.skills[1].keywords).toBe("Edited");
	});
});
