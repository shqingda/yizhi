import { normalizeResume, type Resume } from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";

export const STORAGE_KEY = "yizhi:draft";
export const SLUG_KEY = "yizhi:slug";

export const SIDEBAR_KEY = "yizhi:sidebar";

const LEGACY_KEYS = {
	[STORAGE_KEY]: "resume-studio:draft",
	[SLUG_KEY]: "resume-studio:slug",
	[SIDEBAR_KEY]: "resume-studio:sidebar",
} as const;

type LocalKey = keyof typeof LEGACY_KEYS;

/** Read and write the same key until copying the legacy value succeeds. */
function resolveLocalKey(key: LocalKey): string {
	if (localStorage.getItem(key) !== null) return key;
	const legacyKey = LEGACY_KEYS[key];
	const legacy = localStorage.getItem(legacyKey);
	if (legacy === null) return key;
	try {
		localStorage.setItem(key, legacy);
		return key;
	} catch {
		return legacyKey;
	}
}

export function readLocalValue(key: LocalKey): string | null {
	return localStorage.getItem(resolveLocalKey(key));
}

export function writeLocalValue(key: LocalKey, value: string): void {
	localStorage.setItem(resolveLocalKey(key), value);
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
	writeLocalValue(STORAGE_KEY, JSON.stringify(resume));
}

export function loadLocalSlug(): string {
	return readLocalValue(SLUG_KEY) || "shqingda";
}

export function saveLocalSlug(slug: string) {
	writeLocalValue(SLUG_KEY, slug);
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
