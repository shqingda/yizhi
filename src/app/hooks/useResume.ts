import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeResume, type Resume } from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";
import { fetchHealth, fetchResume, saveResume } from "@/lib/api";
import {
	loadLocalResume,
	loadLocalSlug,
	saveLocalResume,
	saveLocalSlug,
} from "@/lib/storage";

export function useResume() {
	const [resume, setResume] = useState<Resume>(() =>
		typeof window === "undefined" ? structuredClone(SAMPLE_RESUME) : loadLocalResume(),
	);
	const [slug, setSlugState] = useState(() =>
		typeof window === "undefined" ? "shqingda" : loadLocalSlug(),
	);
	const [dbAvailable, setDbAvailable] = useState(false);
	const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [hydrated, setHydrated] = useState(false);
	const resumeRef = useRef(resume);
	resumeRef.current = resume;

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

	const persistCloud = useCallback(async () => {
		if (!dbAvailable) return false;
		setSaving(true);
		try {
			const saved = await saveResume(slug, resumeRef.current, slug);
			if (saved) {
				setCloudUpdatedAt(saved.updatedAt);
				return true;
			}
			return false;
		} finally {
			setSaving(false);
		}
	}, [dbAvailable, slug]);

	useEffect(() => {
		if (!hydrated || !dbAvailable) return;
		const timer = window.setTimeout(() => {
			void persistCloud();
		}, 1600);
		return () => window.clearTimeout(timer);
	}, [resume, hydrated, dbAvailable, persistCloud]);

	return {
		resume,
		setResume,
		replace,
		resetSample,
		slug,
		setSlug,
		dbAvailable,
		cloudUpdatedAt,
		saving,
		persistCloud,
		hydrated,
	};
}
