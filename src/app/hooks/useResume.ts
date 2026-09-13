import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { normalizeResume, type Resume } from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";
import { fetchHealth, fetchResume, saveResume } from "@/lib/api";
import {
	loadLocalResume,
	loadLocalSlug,
	saveLocalResume,
	saveLocalSlug,
} from "@/lib/storage";

export type PersistResult = "ok" | "conflict" | "local";

export function useResume() {
	const [resume, setResume] = useState<Resume>(() =>
		typeof window === "undefined" ? structuredClone(SAMPLE_RESUME) : loadLocalResume(),
	);
	const [slug, setSlugState] = useState(() =>
		typeof window === "undefined" ? "shqingda" : loadLocalSlug(),
	);
	const [dbAvailable, setDbAvailable] = useState(false);
	const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
	const [cloudConflict, setCloudConflict] = useState(false);
	const [saving, setSaving] = useState(false);
	const [hydrated, setHydrated] = useState(false);
	const resumeRef = useRef(resume);
	resumeRef.current = resume;
	const conflictNotified = useRef(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const health = await fetchHealth();
			if (cancelled) return;
			setDbAvailable(health.db);
			if (health.db) {
				const remote = await fetchResume(slug);
				if (cancelled) return;
				if (remote?.data) {
					const hasLocal = Boolean(localStorage.getItem("resume-studio:draft"));
					if (!hasLocal) {
						setResume(normalizeResume(remote.data));
					}
					setCloudUpdatedAt(remote.updatedAt);
				}
			}
			setHydrated(true);
		})();
		return () => {
			cancelled = true;
		};
		// Load once on mount; slug edits after that are user-driven.
	}, []);

	useEffect(() => {
		if (!hydrated) return;
		const timer = window.setTimeout(() => saveLocalResume(resume), 350);
		return () => window.clearTimeout(timer);
	}, [resume, hydrated]);

	const setSlug = useCallback((next: string) => {
		const clean = next.trim() || "shqingda";
		setSlugState(clean);
		saveLocalSlug(clean);
	}, []);

	const replace = useCallback((next: Resume) => {
		setResume(normalizeResume(next));
	}, []);

	const resetSample = useCallback(() => {
		setResume(structuredClone(SAMPLE_RESUME));
	}, []);

	const persistCloud = useCallback(
		async (options?: { force?: boolean }): Promise<PersistResult> => {
			if (!dbAvailable) return "local";
			if (cloudConflict && !options?.force) return "conflict";
			setSaving(true);
			try {
				const saved = await saveResume(slug, resumeRef.current, slug, {
					baseUpdatedAt: cloudUpdatedAt,
					force: options?.force,
				});
				if (saved.status === "saved") {
					setCloudUpdatedAt(saved.resume.updatedAt);
					setCloudConflict(false);
					conflictNotified.current = false;
					return "ok";
				}
				if (saved.status === "conflict") {
					setCloudConflict(true);
					if (!conflictNotified.current) {
						conflictNotified.current = true;
						toast.message("云端有更新，已保留本地稿。可在菜单里覆盖保存。");
					}
					return "conflict";
				}
				return "local";
			} finally {
				setSaving(false);
			}
		},
		[cloudConflict, cloudUpdatedAt, dbAvailable, slug],
	);

	useEffect(() => {
		if (!hydrated || !dbAvailable || cloudConflict) return;
		const timer = window.setTimeout(() => {
			void persistCloud();
		}, 1600);
		return () => window.clearTimeout(timer);
	}, [resume, hydrated, dbAvailable, cloudConflict, persistCloud]);

	return {
		resume,
		setResume,
		replace,
		resetSample,
		slug,
		setSlug,
		dbAvailable,
		cloudUpdatedAt,
		cloudConflict,
		saving,
		persistCloud,
		hydrated,
	};
}
