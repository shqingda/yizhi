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
): Promise<ResumeResponse | null> {
	try {
		const res = await fetch(`/api/resumes/${encodeURIComponent(idOrSlug)}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ data: resume, slug }),
		});
		if (!res.ok) return null;
		return (await res.json()) as ResumeResponse;
	} catch {
		return null;
	}
}
