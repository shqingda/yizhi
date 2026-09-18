import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq, or } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { resumes } from "../db/schema";
import { DEFAULT_SLUG, normalizeResume } from "../shared/schema";
import { SAMPLE_ID, SAMPLE_RESUME, SAMPLE_SLUG } from "../shared/seed";
import { isStaleWrite } from "../shared/sync";

type AppEnv = { Bindings: Env };

const app = new Hono<AppEnv>();

app.use("/api/*", cors());

function hasDb(env: Env): env is Env & { DB: D1Database } {
	return Boolean(env.DB);
}

async function openDb(env: Env): Promise<DrizzleD1Database | null> {
	if (!hasDb(env)) return null;
	try {
		await env.DB.prepare(
			"CREATE TABLE IF NOT EXISTS resumes (id TEXT PRIMARY KEY NOT NULL, slug TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)",
		).run();
		await env.DB.prepare(
			"CREATE UNIQUE INDEX IF NOT EXISTS resumes_slug_unique ON resumes (slug)",
		).run();
		return drizzle(env.DB);
	} catch {
		return null;
	}
}

function parseResumeJson(raw: string) {
	try {
		return normalizeResume(JSON.parse(raw));
	} catch {
		return null;
	}
}

app.get("/api/health", async (c) => {
	const db = await openDb(c.env).catch(() => null);
	return c.json({
		ok: true,
		service: "yizhi",
		db: Boolean(db),
		time: new Date().toISOString(),
	});
});

app.get("/api/resumes", async (c) => {
	const db = await openDb(c.env);
	if (!db) {
		return c.json({ fallback: true, items: [] }, 503);
	}

	const rows = await db.select().from(resumes);
	return c.json({
		fallback: false,
		items: rows.map((row) => ({
			id: row.id,
			slug: row.slug,
			updatedAt: row.updatedAt,
		})),
	});
});

app.get("/api/resumes/:idOrSlug", async (c) => {
	const idOrSlug = c.req.param("idOrSlug");
	const db = await openDb(c.env);

	if (!db) {
		if (idOrSlug === SAMPLE_SLUG || idOrSlug === SAMPLE_ID || idOrSlug === "default") {
			return c.json({
				fallback: true,
				id: SAMPLE_ID,
				slug: SAMPLE_SLUG,
				data: SAMPLE_RESUME,
				updatedAt: null,
			});
		}
		return c.json({ error: "D1 unavailable", fallback: true }, 503);
	}

	const [row] = await db
		.select()
		.from(resumes)
		.where(or(eq(resumes.id, idOrSlug), eq(resumes.slug, idOrSlug)));

	if (!row) {
		if (idOrSlug === SAMPLE_SLUG || idOrSlug === SAMPLE_ID || idOrSlug === DEFAULT_SLUG) {
			const now = new Date().toISOString();
			await db.insert(resumes).values({
				id: SAMPLE_ID,
				slug: SAMPLE_SLUG,
				data: JSON.stringify(SAMPLE_RESUME),
				updatedAt: now,
			});
			return c.json({
				fallback: false,
				id: SAMPLE_ID,
				slug: SAMPLE_SLUG,
				data: SAMPLE_RESUME,
				updatedAt: now,
			});
		}
		return c.json({ error: "Resume not found" }, 404);
	}

	const data = parseResumeJson(row.data);
	if (!data) {
		return c.json({ error: "Stored resume is invalid JSON" }, 500);
	}

	return c.json({
		fallback: false,
		id: row.id,
		slug: row.slug,
		data,
		updatedAt: row.updatedAt,
	});
});

app.put("/api/resumes/:idOrSlug", async (c) => {
	const idOrSlug = c.req.param("idOrSlug");
	const db = await openDb(c.env);
	if (!db) {
		return c.json({ error: "D1 unavailable", fallback: true }, 503);
	}

	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const payload = (body ?? {}) as Record<string, unknown>;
	const data = normalizeResume(payload.data ?? payload);
	const slug =
		typeof payload.slug === "string" && payload.slug.trim()
			? payload.slug.trim()
			: idOrSlug === SAMPLE_ID
				? SAMPLE_SLUG
				: idOrSlug;
	const id =
		typeof payload.id === "string" && payload.id.trim()
			? payload.id.trim()
			: idOrSlug === SAMPLE_SLUG
				? SAMPLE_ID
				: idOrSlug;
	const now = new Date().toISOString();

	const baseUpdatedAt =
		typeof payload.baseUpdatedAt === "string"
			? payload.baseUpdatedAt
			: c.req.header("If-Match");

	const [existing] = await db
		.select()
		.from(resumes)
		.where(or(eq(resumes.id, id), eq(resumes.slug, slug), eq(resumes.id, idOrSlug), eq(resumes.slug, idOrSlug)));

	if (existing && isStaleWrite(existing.updatedAt, baseUpdatedAt)) {
		const current = parseResumeJson(existing.data);
		return c.json(
			{
				error: "conflict",
				id: existing.id,
				slug: existing.slug,
				data: current ?? SAMPLE_RESUME,
				updatedAt: existing.updatedAt,
			},
			409,
		);
	}

	if (existing) {
		await db
			.update(resumes)
			.set({
				slug,
				data: JSON.stringify(data),
				updatedAt: now,
			})
			.where(eq(resumes.id, existing.id));
		return c.json({
			ok: true,
			id: existing.id,
			slug,
			data,
			updatedAt: now,
		});
	}

	await db.insert(resumes).values({
		id,
		slug,
		data: JSON.stringify(data),
		updatedAt: now,
	});

	return c.json({ ok: true, id, slug, data, updatedAt: now }, 201);
});

export default app;
