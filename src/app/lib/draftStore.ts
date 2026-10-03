import { isResumeLike, normalizeResume, type Resume, uid } from "@shared/schema";
import { STORAGE_KEY } from "./storage";

export const WORKSPACE_KEY = "yizhi:workspace:v2";
const BACKUP_LIMIT = 2 * 1024 * 1024;
interface RecoveryPoint {
	id: string;
	label: string;
	time: string;
	data: Resume;
}
export interface Draft {
	id: string;
	name: string;
	updatedAt: string | null;
	data: Resume;
	backups: RecoveryPoint[];
}
export interface Workspace {
	version: 2;
	activeId: string;
	drafts: Draft[];
}
export function createDraft(data: Resume, name = "未命名简历"): Draft {
	const id = uid("draft");
	return { id, name, updatedAt: null, data: structuredClone(data), backups: [] };
}
export function loadWorkspace(raw = localStorage.getItem(WORKSPACE_KEY)): Workspace | null {
	if (raw !== null) {
		const value = JSON.parse(raw) as Workspace;
		if (
			!value ||
			value.version !== 2 ||
			!Array.isArray(value.drafts) ||
			!value.drafts.length ||
			value.drafts.some(
				(d) =>
					!d ||
					typeof d.id !== "string" ||
					!d.id ||
					typeof d.name !== "string" ||
					!isResumeLike(d.data) ||
					(d.backups != null &&
						(!Array.isArray(d.backups) ||
							d.backups.some(
								(b) =>
									!b ||
									typeof b.id !== "string" ||
									typeof b.time !== "string" ||
									typeof b.label !== "string" ||
									!isResumeLike(b.data),
							))),
			) ||
			new Set(value.drafts.map((d) => d.id)).size !== value.drafts.length ||
			!value.drafts.some((d) => d.id === value.activeId)
		)
			throw new Error("草稿记录无法读取，请保留浏览器数据。");
		return {
			version: 2,
			activeId: value.activeId,
			drafts: value.drafts.map((d) => ({
				id: d.id,
				name: d.name,
				updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : null,
				data: normalizeResume(d.data),
				backups: (d.backups ?? []).map((b) => ({ ...b, data: normalizeResume(b.data) })),
			})),
		};
	}
	const legacy = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("resume-studio:draft");
	if (legacy === null) return null;
	const parsed: unknown = JSON.parse(legacy);
	if (!isResumeLike(parsed)) throw new Error("旧草稿格式无法读取，请保留浏览器数据。");
	const data = normalizeResume(parsed);
	const draft = createDraft(data, data.basics.name ? `${data.basics.name}的简历` : "未命名简历");
	return { version: 2, activeId: draft.id, drafts: [draft] };
}
export class WorkspaceConflictError extends Error {
	constructor() {
		super("其他页面已更新或清除了本机草稿，已暂停保存。请先下载当前稿 JSON，再刷新读取最新内容。");
		this.name = "WorkspaceConflictError";
	}
}

export function saveWorkspace(workspace: Workspace, expectedSnapshot?: string | null) {
	if (JSON.stringify(workspace.drafts.flatMap((d) => d.backups)).length * 2 > BACKUP_LIMIT)
		throw new Error("恢复点容量已满，请下载并删除旧恢复点");
	const raw = JSON.stringify(workspace);
	const current = localStorage.getItem(WORKSPACE_KEY);
	if (expectedSnapshot !== undefined && current !== expectedSnapshot)
		throw new WorkspaceConflictError();
	// One atomic write keeps the active pointer, drafts and recovery points together.
	if (current !== raw) localStorage.setItem(WORKSPACE_KEY, raw);
	return raw;
}
export function withBackup(workspace: Workspace, id: string, label: string): Workspace {
	const next = {
		...workspace,
		drafts: workspace.drafts.map((d) =>
			d.id !== id
				? d
				: {
						...d,
						backups: [
							{ id: uid("backup"), label, time: new Date().toISOString(), data: structuredClone(d.data) },
							...d.backups,
						].slice(0, 5),
					},
		),
	};
	if (JSON.stringify(next.drafts.flatMap((d) => d.backups)).length * 2 > BACKUP_LIMIT)
		throw new Error("恢复点容量已满。请下载备份，并删除不需要的恢复点后重试。");
	return next;
}
/** Restore deleted records without undoing unrelated edits made since deletion. */
export function restoreRemoved(before: Resume, after: Resume, current: Resume): Resume {
	const restore = <T extends { id: string }>(old: T[], changed: T[], now: T[]) => {
		const result = [...now];
		for (const [index, item] of old.entries()) {
			if (changed.some((x) => x.id === item.id) || result.some((x) => x.id === item.id)) continue;
			const next = old.slice(index + 1).find((x) => result.some((y) => y.id === x.id));
			result.splice(next ? result.findIndex((x) => x.id === next.id) : result.length, 0, item);
		}
		return result;
	};
	return {
		...current,
		skills: restore(before.skills, after.skills, current.skills),
		experience: restore(before.experience, after.experience, current.experience),
		projects: restore(before.projects, after.projects, current.projects),
		education: restore(before.education, after.education, current.education),
		awards: restore(before.awards, after.awards, current.awards),
		publications: restore(before.publications, after.publications, current.publications),
		languages: restore(before.languages, after.languages, current.languages),
		customSections: restore(before.customSections, after.customSections, current.customSections).map(
			(section) => {
				const old = before.customSections.find((s) => s.id === section.id),
					changed = after.customSections.find((s) => s.id === section.id);
				return old && changed
					? { ...section, items: restore(old.items, changed.items, section.items) }
					: section;
			},
		),
	};
}
