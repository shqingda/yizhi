import { emptyResume } from "@shared/schema";
import { createDraft, loadWorkspace, type Workspace } from "./draftStore";
import { loadSampleResume } from "./sampleResume";

export interface InitialWorkspace {
	workspace: Workspace;
	error: string;
}

export async function initializeWorkspace(): Promise<InitialWorkspace> {
	try {
		const workspace = loadWorkspace();
		if (workspace) return { workspace, error: "" };
	} catch {
		// Never overwrite an unreadable record or require a network request to recover it.
		const draft = createDraft(emptyResume());
		return {
			workspace: { version: 2, activeId: draft.id, drafts: [draft] },
			error: "无法读取本机草稿，已停止自动保存。请保留浏览器数据，检查存储权限后刷新重试。",
		};
	}
	const draft = createDraft(await loadSampleResume(), "示例简历");
	return { workspace: { version: 2, activeId: draft.id, drafts: [draft] }, error: "" };
}
