import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_RESUME } from "@shared/seed";
import { useResume } from "@/hooks/useResume";
import { STORAGE_KEY } from "@/lib/storage";
import { jsonResponse } from "./helpers/http";

function mockApi(options?: {
	db?: boolean;
	remote?: unknown;
	save?: unknown;
	saveStatus?: number;
}) {
	const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		if (url === "/api/health") {
			return jsonResponse({ ok: true, db: options?.db ?? false });
		}
		if (init?.method === "PUT") {
			if ((options?.saveStatus ?? 200) >= 400) {
				return jsonResponse({ error: "fail" }, options?.saveStatus ?? 500);
			}
			return jsonResponse(
				options?.save ?? {
					id: "default",
					slug: "shqingda",
					data: SAMPLE_RESUME,
					updatedAt: "2026-09-12T16:00:00.000Z",
				},
			);
		}
		if (url.startsWith("/api/resumes/")) {
			if (options?.remote === null) {
				return jsonResponse({ error: "missing" }, 404);
			}
			return jsonResponse(
				options?.remote ?? {
					id: "default",
					slug: "shqingda",
					data: SAMPLE_RESUME,
					updatedAt: "2026-09-12T12:00:00.000Z",
				},
			);
		}
		return jsonResponse({ error: "unhandled" }, 500);
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

async function flushHydration() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
	});
}

beforeEach(() => {
	localStorage.clear();
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("useResume", () => {
	it("hydrates from the sample when there is no draft and no database", async () => {
		mockApi({ db: false });
		const { result } = renderHook(() => useResume());
		await flushHydration();
		expect(result.current.hydrated).toBe(true);
		expect(result.current.dbAvailable).toBe(false);
		expect(result.current.resume.basics.name).toBe("商庆达");
	});

	it("keeps a local draft instead of overwriting it with the cloud copy", async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				...SAMPLE_RESUME,
				basics: { ...SAMPLE_RESUME.basics, label: "全栈工程师" },
			}),
		);
		mockApi({
			db: true,
			remote: {
				id: "default",
				slug: "shqingda",
				data: SAMPLE_RESUME,
				updatedAt: "2026-09-12T12:00:00.000Z",
			},
		});
		const { result } = renderHook(() => useResume());
		await flushHydration();
		expect(result.current.hydrated).toBe(true);
		expect(result.current.resume.basics.label).toBe("全栈工程师");
		expect(result.current.cloudUpdatedAt).toBe("2026-09-12T12:00:00.000Z");
	});

	it("loads the cloud resume when this browser has no draft", async () => {
		mockApi({
			db: true,
			remote: {
				id: "default",
				slug: "shqingda",
				data: {
					...SAMPLE_RESUME,
					basics: { ...SAMPLE_RESUME.basics, label: "全栈工程师" },
				},
				updatedAt: "2026-09-12T12:00:00.000Z",
			},
		});
		const { result } = renderHook(() => useResume());
		await flushHydration();
		expect(result.current.resume.basics.label).toBe("全栈工程师");
	});

	it("still hydrates when the cloud read fails", async () => {
		mockApi({ db: true, remote: null });
		const { result } = renderHook(() => useResume());
		await flushHydration();
		expect(result.current.hydrated).toBe(true);
		expect(result.current.cloudUpdatedAt).toBeNull();
	});

	it("writes localStorage 350ms after an edit", async () => {
		mockApi({ db: false });
		const { result } = renderHook(() => useResume());
		await flushHydration();

		act(() => {
			result.current.setResume((current) => ({
				...current,
				basics: { ...current.basics, label: "全栈工程师" },
			}));
		});

		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		act(() => {
			vi.advanceTimersByTime(349);
		});
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "").basics.label).toBe("全栈工程师");
	});

	it("writes the cloud copy 1.6s after an edit", async () => {
		const fetchMock = mockApi({ db: true });
		const { result } = renderHook(() => useResume());
		await flushHydration();

		act(() => {
			result.current.setResume((current) => ({
				...current,
				basics: { ...current.basics, label: "全栈工程师" },
			}));
		});

		const putsBefore = fetchMock.mock.calls.filter((call) => call[1]?.method === "PUT").length;
		act(() => {
			vi.advanceTimersByTime(1599);
		});
		expect(fetchMock.mock.calls.filter((call) => call[1]?.method === "PUT")).toHaveLength(putsBefore);

		await act(async () => {
			vi.advanceTimersByTime(1);
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(fetchMock.mock.calls.some((call) => call[1]?.method === "PUT")).toBe(true);
		expect(result.current.cloudUpdatedAt).toBe("2026-09-12T16:00:00.000Z");
	});

	it("lets persistCloud return false when D1 is down", async () => {
		mockApi({ db: false });
		const { result } = renderHook(() => useResume());
		await flushHydration();
		await expect(result.current.persistCloud()).resolves.toBe(false);
	});

	it("normalizes imported JSON and can reset to the sample", async () => {
		mockApi({ db: false });
		const { result } = renderHook(() => useResume());
		await flushHydration();

		act(() => {
			result.current.replace({ basics: { name: "Ada", label: "Dev" } } as never);
		});
		expect(result.current.resume.basics.name).toBe("Ada");
		expect(result.current.resume.skills).toEqual([]);

		act(() => {
			result.current.resetSample();
		});
		expect(result.current.resume.basics.name).toBe("商庆达");
	});

	it("stores a slug and falls back to shqingda when cleared", async () => {
		mockApi({ db: false });
		const { result } = renderHook(() => useResume());
		await flushHydration();

		act(() => {
			result.current.setSlug(" ada ");
		});
		expect(result.current.slug).toBe("ada");
		expect(localStorage.getItem("resume-studio:slug")).toBe("ada");

		act(() => {
			result.current.setSlug("   ");
		});
		expect(result.current.slug).toBe("shqingda");
	});
});
