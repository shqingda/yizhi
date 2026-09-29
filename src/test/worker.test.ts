import { describe, expect, it } from "vitest";
import app from "../worker/index";
describe("browser-only edition", () => {
	it("does not expose authentication, cloud drafts or publications", async () => {
		for (const path of ["/api/auth/config", "/api/resumes", "/api/resumes/default", "/api/public/shqingda"]) expect((await app.request(path)).status).toBe(410);
		expect((await app.request("/api/resumes/default", { method: "PUT" })).status).toBe(410);
	});
});
