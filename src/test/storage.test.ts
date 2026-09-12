import { afterEach, describe, expect, it } from "vitest";
import { SAMPLE_RESUME } from "@shared/seed";
import {
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
