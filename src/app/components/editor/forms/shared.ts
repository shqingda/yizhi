import type { Resume } from "@shared/schema";

export interface FormProps {
	resume: Resume;
	setResume: (updater: (current: Resume) => Resume) => void;
}

export function patch<K extends keyof Resume>(setResume: FormProps["setResume"], key: K, value: Resume[K]) {
	setResume((current) => ({ ...current, [key]: value }));
}

export function patchMeta(setResume: FormProps["setResume"], partial: Partial<Resume["meta"]>) {
	setResume((current) => ({ ...current, meta: { ...current.meta, ...partial } }));
}
