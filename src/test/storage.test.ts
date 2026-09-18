import { afterEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_RESUME } from "@shared/seed";
import {
	SIDEBAR_KEY,
	readLocalValue,
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
