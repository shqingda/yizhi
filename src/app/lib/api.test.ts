import { afterEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_RESUME } from "@shared/seed";
import { jsonResponse } from "../../test/http";
import { fetchHealth, fetchResume, saveResume } from "./api";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("fetchHealth", () => {
	it("returns the API payload when healthy", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(jsonResponse({ ok: true, db: true, service: "resume-studio" })),
		);
		await expect(fetchHealth()).resolves.toEqual({
			ok: true,
			db: true,
			service: "resume-studio",
		});
		expect(fetch).toHaveBeenCalledWith("/api/health");
	});

	it("treats a failed request as no database", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
		await expect(fetchHealth()).resolves.toEqual({ ok: false, db: false });
	});

	it("treats a non-OK response as no database", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ok: false }, 500)));
		await expect(fetchHealth()).resolves.toEqual({ ok: false, db: false });
	});
});

describe("fetchResume", () => {
	it("returns the resume payload", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				jsonResponse({
					id: "default",
					slug: "shqingda",
					data: SAMPLE_RESUME,
					updatedAt: "2026-09-12T00:00:00.000Z",
				}),
			),
		);
		const result = await fetchResume("shqingda");
		expect(result?.slug).toBe("shqingda");
		expect(result?.data.basics.name).toBe("商庆达");
		expect(fetch).toHaveBeenCalledWith("/api/resumes/shqingda");
	});

	it("returns null when the resume is missing", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "missing" }, 404)));
		await expect(fetchResume("missing")).resolves.toBeNull();
	});
});

describe("saveResume", () => {
	it("PUTs the resume JSON", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({
				ok: true,
				id: "default",
				slug: "shqingda",
				data: SAMPLE_RESUME,
				updatedAt: "2026-09-12T00:00:00.000Z",
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const saved = await saveResume("shqingda", SAMPLE_RESUME, "shqingda");
		expect(saved?.updatedAt).toBe("2026-09-12T00:00:00.000Z");
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/resumes/shqingda",
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify({ data: SAMPLE_RESUME, slug: "shqingda" }),
			}),
		);
	});

	it("returns null when the write fails", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "nope" }, 503)));
		await expect(saveResume("shqingda", SAMPLE_RESUME)).resolves.toBeNull();
	});
});
