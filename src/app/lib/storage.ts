import { normalizeResume, type Resume } from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";

export const STORAGE_KEY = "yizhi:draft";
export const SLUG_KEY = "yizhi:slug";

export const SIDEBAR_KEY = "yizhi:sidebar";

/** Copy old values on first read; retain the originals for recovery. */
export function readLocalValue(key: string): string | null {
	const current = localStorage.getItem(key);
	if (current !== null) return current;
	const legacy = localStorage.getItem(key.replace(/^yizhi:/, "resume-studio:"));
	if (legacy !== null) {
		try {
			localStorage.setItem(key, legacy);
		} catch {
			// A full storage quota must not prevent reading an existing draft.
		}
	}
	return legacy;
}

export function loadLocalResume(): Resume {
	try {
		const raw = readLocalValue(STORAGE_KEY);
		if (!raw) return structuredClone(SAMPLE_RESUME);
		return normalizeResume(JSON.parse(raw));
	} catch {
		return structuredClone(SAMPLE_RESUME);
	}
}

export function saveLocalResume(resume: Resume) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
}

export function loadLocalSlug(): string {
	return readLocalValue(SLUG_KEY) || "shqingda";
}

export function saveLocalSlug(slug: string) {
	localStorage.setItem(SLUG_KEY, slug);
}

export function downloadJson(resume: Resume, filename = "resume.json") {
	const blob = new Blob([JSON.stringify(resume, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

export function readJsonFile(file: File): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				resolve(JSON.parse(String(reader.result)));
			} catch (error) {
				reject(error);
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}
