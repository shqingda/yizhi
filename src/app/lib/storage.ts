export const STORAGE_KEY = "yizhi:draft";

export const SIDEBAR_KEY = "yizhi:sidebar";

const LEGACY_KEYS = {
	[STORAGE_KEY]: "resume-studio:draft",
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
