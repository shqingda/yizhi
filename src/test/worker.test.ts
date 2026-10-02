import { describe, expect, it } from "vitest";
import app from "../worker/index";
const request = (path: string, init?: RequestInit) =>
	app.fetch(new Request(`https://yizhi.test${path}`, init));
describe("browser-only edition", () => {
	it("does not expose authentication, cloud drafts or publications", async () => {
		for (const path of ["/api/auth/config", "/api/resumes", "/api/resumes/default", "/api/public/shqingda"]) {
			const response = request(path);
			expect(response.status).toBe(410);
			expect(response.headers.get("Cache-Control")).toBe("no-store");
		}
		expect(request("/api/resumes/default", { method: "PUT" }).status).toBe(410);
	});
	it("reports browser storage without requiring database bindings", async () => {
		const response = request("/api/health");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, service: "yizhi", storage: "browser" });
	});
});
