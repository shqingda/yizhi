import { emptyResume } from "@shared/schema";
import { createDraft, loadWorkspace, WORKSPACE_KEY, type Workspace } from "./draftStore";
import { loadSampleResume } from "./sampleResume";

export interface InitialWorkspace {
	workspace: Workspace;
	error: string;
	storageSnapshot: string | null;
}

export async function initializeWorkspace(): Promise<InitialWorkspace> {
	let storageSnapshot: string | null = null;
	try {
		storageSnapshot = localStorage.getItem(WORKSPACE_KEY);
		const workspace = loadWorkspace(storageSnapshot);
		if (workspace) return { workspace, error: "", storageSnapshot };
	} catch {
		// Never overwrite an unreadable record or require a network request to recover it.
		const draft = createDraft(emptyResume());
		return {
			workspace: { version: 2, activeId: draft.id, drafts: [draft] },
			error: "无法读取本机草稿，已停止自动保存。请保留浏览器数据，检查存储权限后刷新重试。",
			storageSnapshot,
		};
	}
	const draft = createDraft(await loadSampleResume(), "示例简历");
	// Retain the snapshot from before the download; a later write must not replace
	// a workspace that another page created while the sample was loading.
	return { workspace: { version: 2, activeId: draft.id, drafts: [draft] }, error: "", storageSnapshot };
}
