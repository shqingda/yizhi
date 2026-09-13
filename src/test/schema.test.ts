import { describe, expect, it } from "vitest";
import {
	DEFAULT_META,
	SECTION_KEYS,
	emptyResume,
	isResumeLike,
	normalizeResume,
	toggleHidden,
	uid,
} from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";
import sampleResumeJson from "../../public/sample-resume.json?raw";

describe("toggleHidden", () => {
	it("adds and removes a key", () => {
		expect(toggleHidden(["awards"], "projects")).toEqual(["awards", "projects"]);
		expect(toggleHidden(["awards", "projects"], "awards")).toEqual(["projects"]);
	});
});

describe("uid", () => {
	it("uses the given prefix and returns unique values", () => {
		const ids = new Set(Array.from({ length: 20 }, () => uid("skill")));
		expect([...ids].every((id) => id.startsWith("skill_"))).toBe(true);
		expect(ids.size).toBe(20);
	});
});

describe("emptyResume", () => {
	it("returns a blank resume with default meta", () => {
		const resume = emptyResume();
		expect(resume.basics).toEqual({ name: "", label: "" });
		expect(resume.skills).toEqual([]);
		expect(resume.meta).toEqual({
			...DEFAULT_META,
			sectionOrder: [...SECTION_KEYS],
		});
	});
});

describe("isResumeLike", () => {
	it("accepts objects that have a basics object", () => {
		expect(isResumeLike({ basics: { name: "Ada" } })).toBe(true);
		expect(isResumeLike(SAMPLE_RESUME)).toBe(true);
	});

	it("rejects everything else", () => {
		expect(isResumeLike(null)).toBe(false);
		expect(isResumeLike("resume")).toBe(false);
		expect(isResumeLike({ basics: "商庆达" })).toBe(false);
		expect(isResumeLike({ name: "商庆达" })).toBe(false);
	});
});

describe("normalizeResume", () => {
	it("returns a usable empty resume for invalid input", () => {
		expect(normalizeResume(null).basics).toEqual({ name: "", label: "" });
		expect(normalizeResume("nope").skills).toEqual([]);
		expect(normalizeResume(undefined).meta.layoutMode).toBe("multi");
	});

	it("keeps a valid sample intact", () => {
		const template = JSON.parse(sampleResumeJson);
		const resume = normalizeResume(template);
		expect(resume).toMatchObject(template);
		expect(SAMPLE_RESUME).toEqual(resume);
		expect(normalizeResume(resume)).toEqual(resume);
	});

	it("drops empty optional strings and non-string highlights", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Engineer", email: "", phone: 123 },
			experience: [
				{
					id: "exp_1",
					company: "Acme",
					position: "Dev",
					startDate: "2020",
					endDate: "2021",
					highlights: ["shipped", 1, null],
				},
			],
		});
		expect(resume.basics.email).toBeUndefined();
		expect(resume.basics.phone).toBeUndefined();
		expect(resume.experience[0]?.highlights).toEqual(["shipped"]);
	});

	it("fills missing ids and ignores non-array sections", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			skills: [{ name: "TS", keywords: "strict" }],
			projects: "not-a-list",
		});
		expect(resume.skills[0]?.id).toMatch(/^skill0_/);
		expect(resume.skills[0]?.name).toBe("TS");
		expect(resume.projects).toEqual([]);
	});

	it("backfills sample project dates when the known id has none", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			projects: [{ id: "proj_cloud", name: "云应用客户端", highlights: [] }],
		});
		expect(resume.projects[0]).toMatchObject({
			startDate: "2022/04",
			endDate: "2022/06",
		});
	});

	it("preserves explicitly cleared dates even for a known sample project id", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			projects: [{ id: "proj_cloud", name: "My project", startDate: "", endDate: "", highlights: [] }],
		});
		expect(resume.projects[0]).toMatchObject({ startDate: "", endDate: "" });
		expect(normalizeResume(resume).projects[0]).toEqual(resume.projects[0]);
	});

	it("migrates the leftover blue accent and the pre-redesign section order", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			meta: {
				accentColor: "#2563EB",
				sectionOrder: [
					"skills",
					"experience",
					"projects",
					"education",
					"awards",
					"publications",
					"languages",
					"custom",
				],
			},
		});
		expect(resume.meta.accentColor).toBe(DEFAULT_META.accentColor);
		expect(resume.meta.sectionOrder).toEqual([...SECTION_KEYS]);
	});

	it("keeps a custom section order and appends missing keys", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			meta: { sectionOrder: ["projects", "nope", "education"] },
		});
		expect(resume.meta.sectionOrder[0]).toBe("projects");
		expect(resume.meta.sectionOrder[1]).toBe("education");
		expect(resume.meta.sectionOrder).toEqual(expect.arrayContaining([...SECTION_KEYS]));
		expect(new Set(resume.meta.sectionOrder).size).toBe(SECTION_KEYS.length);
	});

	it("falls back to safe meta values", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			meta: { layoutMode: "poster", fontScale: "large", showPhoto: "yes" },
		});
		expect(resume.meta.layoutMode).toBe("multi");
		expect(resume.meta.fontScale).toBe(1);
		expect(resume.meta.showPhoto).toBe(false);
	});

	it("accepts single-page layout and a custom font scale", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			meta: { layoutMode: "single", fontScale: 1.1, showPhoto: true },
		});
		expect(resume.meta.layoutMode).toBe("single");
		expect(resume.meta.fontScale).toBe(1.1);
		expect(resume.meta.showPhoto).toBe(true);
	});

	it("normalizes header alignment, hidden sections, and contact order", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev", birthday: "1996/01" },
			meta: {
				headerAlign: "left",
				hiddenSections: ["awards", "nope"],
				basicsOrder: ["phone", "email"],
				hiddenBasics: ["label", "phone"],
			},
		});
		expect(resume.basics.birthday).toBe("1996/01");
		expect(resume.meta.headerAlign).toBe("left");
		expect(resume.meta.hiddenSections).toEqual(["awards"]);
		expect(resume.meta.basicsOrder[0]).toBe("phone");
		expect(resume.meta.basicsOrder[1]).toBe("email");
		expect(resume.meta.basicsOrder).toEqual(expect.arrayContaining([...DEFAULT_META.basicsOrder]));
		expect(resume.meta.hiddenBasics).toEqual(["label", "phone"]);
	});

	it("falls back to a centered header when align is invalid", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			meta: { headerAlign: "justify" },
		});
		expect(resume.meta.headerAlign).toBe("center");
	});

	it("normalizes nested custom sections", () => {
		const resume = normalizeResume({
			basics: { name: "Ada", label: "Dev" },
			customSections: [
				{
					title: "开源",
					items: [{ title: "cn", highlights: ["maintainer", 0] }],
				},
			],
		});
		expect(resume.customSections[0]?.id).toMatch(/^sec0_/);
		expect(resume.customSections[0]?.items[0]?.title).toBe("cn");
		expect(resume.customSections[0]?.items[0]?.highlights).toEqual(["maintainer"]);
	});
});
