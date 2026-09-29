import { normalizeResume, type Resume, uid } from "@shared/schema";
import { SAMPLE_RESUME } from "@shared/seed";
import { readLocalValue, STORAGE_KEY } from "./storage";

export const WORKSPACE_KEY = "yizhi:workspace:v2";
const BACKUP_LIMIT = 2 * 1024 * 1024;
export interface RecoveryPoint { id: string; label: string; time: string; data: Resume }
export interface Draft {
	id: string;
	name: string;
	updatedAt: string | null;
	data: Resume;
	backups: RecoveryPoint[];
}
export interface Workspace { version: 2; activeId: string; drafts: Draft[]; started: boolean }
export function createDraft(data: Resume, name = "未命名简历"): Draft {
	const id = uid("draft");
	return { id, name, updatedAt: null, data: structuredClone(data), backups: [] };
}
export function blankResume() { return normalizeResume({ basics: { name: "", label: "" } }); }
export function loadWorkspace(): Workspace {
	const raw = localStorage.getItem(WORKSPACE_KEY);
	if (raw) {
		const value = JSON.parse(raw) as Workspace;
		if (value.version !== 2 || !Array.isArray(value.drafts) || !value.drafts.length || !value.drafts.some(d => d.id === value.activeId)) throw new Error("草稿记录无法读取，请先下载备份，不要清除浏览器数据。");
		return { ...value, drafts: value.drafts.map(d => ({ ...d, data: normalizeResume(d.data), backups: d.backups ?? [] })) };
	}
	const legacy = readLocalValue(STORAGE_KEY);
	const data = legacy ? normalizeResume(JSON.parse(legacy)) : structuredClone(SAMPLE_RESUME);
	const draft = createDraft(data, data.basics.name ? `${data.basics.name}的简历` : "未命名简历");
	return { version: 2, activeId: draft.id, drafts: [draft], started: true };
}
export function saveWorkspace(workspace: Workspace) {
	if (JSON.stringify(workspace.drafts.flatMap(d => d.backups)).length * 2 > BACKUP_LIMIT) throw new Error("恢复点容量已满，请下载并删除旧恢复点");
	// One atomic write keeps the active pointer, contents and base version together.
	localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}
export function withBackup(workspace: Workspace, id: string, label: string): Workspace {
	const next = { ...workspace, drafts: workspace.drafts.map(d => d.id !== id ? d : {
		...d, backups: [{ id: uid("backup"), label, time: new Date().toISOString(), data: structuredClone(d.data) }, ...d.backups].slice(0, 5),
	}) };
	if (JSON.stringify(next.drafts.flatMap(d => d.backups)).length * 2 > BACKUP_LIMIT) throw new Error("恢复点容量已满。请下载备份，并删除不需要的恢复点后重试。");
	return next;
}
export function pdfFilename(resume: Resume) {
	return `${[resume.basics.name.trim(), resume.basics.label.trim(), "简历"].filter(Boolean).join("-")}.pdf`;
}
export function cleanFilename(value: string) {
	return (value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\.pdf$/i, "").trim().slice(0, 100) || "简历") + ".pdf";
}

/** Restore deleted records without undoing unrelated edits made since deletion. */
export function restoreRemoved(before: Resume, after: Resume, current: Resume): Resume {
	const restore = <T extends { id: string }>(old: T[], changed: T[], now: T[]) => {
		const result = [...now];
		for (const [index, item] of old.entries()) {
			if (changed.some(x => x.id === item.id) || result.some(x => x.id === item.id)) continue;
			const next = old.slice(index + 1).find(x => result.some(y => y.id === x.id));
			result.splice(next ? result.findIndex(x => x.id === next.id) : result.length, 0, item);
		}
		return result;
	};
	return { ...current,
		skills: restore(before.skills, after.skills, current.skills),
		experience: restore(before.experience, after.experience, current.experience),
		projects: restore(before.projects, after.projects, current.projects),
		education: restore(before.education, after.education, current.education),
		awards: restore(before.awards, after.awards, current.awards),
		publications: restore(before.publications, after.publications, current.publications),
		languages: restore(before.languages, after.languages, current.languages),
		customSections: restore(before.customSections, after.customSections, current.customSections).map(section => {
			const old = before.customSections.find(s => s.id === section.id), changed = after.customSections.find(s => s.id === section.id);
			return old && changed ? { ...section, items: restore(old.items, changed.items, section.items) } : section;
		}),
	};
}
