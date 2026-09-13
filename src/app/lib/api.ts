import type { Resume } from "@shared/schema";

export interface HealthResponse {
	ok: boolean;
	service?: string;
	db: boolean;
	time?: string;
}

export interface ResumeResponse {
	fallback?: boolean;
	id: string;
	slug: string;
	data: Resume;
	updatedAt: string | null;
}

export type SaveResumeResult =
	| { status: "saved"; resume: ResumeResponse }
	| { status: "conflict"; remote: ResumeResponse }
	| { status: "error" };

export async function fetchHealth(): Promise<HealthResponse> {
	try {
		const res = await fetch("/api/health");
		if (!res.ok) return { ok: false, db: false };
		return (await res.json()) as HealthResponse;
	} catch {
		return { ok: false, db: false };
	}
}

export async function fetchResume(idOrSlug: string): Promise<ResumeResponse | null> {
	try {
		const res = await fetch(`/api/resumes/${encodeURIComponent(idOrSlug)}`);
		if (!res.ok) return null;
		return (await res.json()) as ResumeResponse;
	} catch {
		return null;
	}
}

export async function saveResume(
	idOrSlug: string,
	resume: Resume,
	slug?: string,
	options?: { baseUpdatedAt?: string | null; force?: boolean },
): Promise<SaveResumeResult> {
	try {
		const headers: Record<string, string> = { "Content-Type": "application/json" };
		const baseUpdatedAt = options?.force ? undefined : options?.baseUpdatedAt || undefined;
		if (baseUpdatedAt) headers["If-Match"] = baseUpdatedAt;

		const res = await fetch(`/api/resumes/${encodeURIComponent(idOrSlug)}`, {
			method: "PUT",
			headers,
			body: JSON.stringify({
				data: resume,
				slug,
				...(baseUpdatedAt ? { baseUpdatedAt } : {}),
			}),
		});
		const payload = (await res.json().catch(() => null)) as ResumeResponse | null;
		if (res.status === 409) {
			return {
				status: "conflict",
				remote: payload?.data ? payload : { id: "", slug: "", data: resume, updatedAt: null },
			};
		}
		if (!res.ok || !payload) return { status: "error" };
		return { status: "saved", resume: payload };
	} catch {
		return { status: "error" };
	}
}
