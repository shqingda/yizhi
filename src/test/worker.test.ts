/// <reference path="../../worker-configuration.d.ts" />
import { describe, expect, it } from "vitest";
import { SAMPLE_ID, SAMPLE_RESUME, SAMPLE_SLUG } from "@shared/seed";
import app from "../worker/index";

const env = {} as Env;

async function api(path: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
	return app.request(path, init, env);
}

describe("worker API without D1", () => {
	it("reports health with db=false", async () => {
		const res = await api("/api/health");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { ok: boolean; db: boolean; service: string };
		expect(body).toMatchObject({ ok: true, db: false, service: "resume-studio" });
	});

	it("lists resumes as unavailable", async () => {
		const res = await api("/api/resumes");
		expect(res.status).toBe(503);
		await expect(res.json()).resolves.toEqual({ fallback: true, items: [] });
	});

	it("returns the sample for the default slug", async () => {
		const res = await api(`/api/resumes/${SAMPLE_SLUG}`);
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			fallback: boolean;
			id: string;
			slug: string;
			data: { basics: { name: string } };
		};
		expect(body.fallback).toBe(true);
		expect(body.id).toBe(SAMPLE_ID);
		expect(body.slug).toBe(SAMPLE_SLUG);
		expect(body.data.basics.name).toBe(SAMPLE_RESUME.basics.name);
	});

	it("returns 503 for an unknown slug when D1 is down", async () => {
		const res = await api("/api/resumes/unknown");
		expect(res.status).toBe(503);
		await expect(res.json()).resolves.toMatchObject({ fallback: true });
	});

	it("rejects writes when D1 is down", async () => {
		const res = await api("/api/resumes/shqingda", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: SAMPLE_RESUME, slug: "shqingda" }),
		});
		expect(res.status).toBe(503);
	});
});
