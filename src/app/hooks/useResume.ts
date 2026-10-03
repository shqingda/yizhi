import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { toast } from "sonner";
import { emptyResume, normalizeResume, type Resume } from "@shared/schema";
import { loadSampleResume } from "@/lib/sampleResume";
import { initializeWorkspace, type InitialWorkspace } from "@/lib/initializeWorkspace";
import type { WorkspaceLeaseHandle } from "@/lib/workspaceLease";
import {
	loadWorkspace,
	restoreRemoved,
	createDraft,
	saveWorkspace,
	withBackup,
	WORKSPACE_KEY,
	WorkspaceConflictError,
	type Draft,
	type Workspace,
} from "@/lib/draftStore";

export type WorkspaceAccess = "checking" | "editor" | "viewer" | "unsupported";

export function useResume(initial: InitialWorkspace, lease: WorkspaceLeaseHandle) {
	const [workspace, setWorkspace] = useState(initial.workspace);
	const workspaceRef = useRef(workspace);
	const [localError, setLocalError] = useState(initial.error);
	const [localPending, setLocalPending] = useState(lease.owned && !initial.storageSnapshot && !initial.error);
	const [accessState, setAccessState] = useState<WorkspaceAccess>(lease.owned ? "editor" : lease.supported ? "viewer" : "unsupported");
	const readError = useRef(initial.error);
	const dirty = useRef(lease.owned && !initial.storageSnapshot && !initial.error);
	const editingReady = useRef(lease.owned);
	const activation = useRef(0);
	const writable = () => lease.owned && editingReady.current && !readError.current && !conflict.current;
	const [localConflict, setLocalConflict] = useState(false);
	const storageSnapshot = useRef(initial.storageSnapshot);
	const conflict = useRef(false);
	const mounted = useRef(true);
	const histories = useRef(
		new Map<string, { past: Resume[]; future: Resume[]; time: number; target?: Element | null }>(),
	);
	const active = workspace.drafts.find((d) => d.id === workspace.activeId)!;
	const current = () => workspaceRef.current.drafts.find((d) => d.id === workspaceRef.current.activeId)!;
	const commit = useCallback((next: Workspace, changed = true) => {
		if (changed) dirty.current = true;
		workspaceRef.current = next;
		if (mounted.current) setWorkspace(next);
	}, []);
	const updateDraft = useCallback(
		(id: string, patch: Partial<Draft>) => {
			commit({
				...workspaceRef.current,
				drafts: workspaceRef.current.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
			});
		},
		[commit],
	);
	const reportConflict = useCallback(() => {
		conflict.current = true;
		if (mounted.current) {
			setLocalConflict(true);
			setLocalError(new WorkspaceConflictError().message);
			setLocalPending(false);
		}
	}, []);
	const persist = useCallback((next: Workspace) => {
		if (!lease.owned || !editingReady.current) throw new Error("此页面为只读，请先取得编辑权。");
		if (readError.current) throw new Error(readError.current);
		if (conflict.current) throw new WorkspaceConflictError();
		try {
			storageSnapshot.current = saveWorkspace(next, storageSnapshot.current);
		} catch (error) {
			if (error instanceof WorkspaceConflictError) reportConflict();
			throw error;
		}
	}, [lease, reportConflict]);
	const flushLocal = useCallback(() => {
		if (!lease.owned || !editingReady.current || readError.current) return false;
		try {
			persist(workspaceRef.current);
			dirty.current = false;
			if (mounted.current) {
				setLocalError("");
				setLocalPending(false);
			}
			return true;
		} catch (error) {
			if (mounted.current) {
				setLocalError(error instanceof WorkspaceConflictError
					? error.message
					: "本机保存失败，请下载备份或释放浏览器存储后重试。");
				setLocalPending(false);
			}
			return false;
		}
	}, [lease, persist]);
	const history = () => {
		const id = current().id;
		if (!histories.current.has(id)) histories.current.set(id, { past: [], future: [], time: 0 });
		return histories.current.get(id)!;
	};
	const setResume = useCallback(
		(action: SetStateAction<Resume>) => {
			if (!writable()) return;
			const draft = current();
			const next = typeof action === "function" ? action(draft.data) : action;
			if (next === draft.data || JSON.stringify(next) === JSON.stringify(draft.data)) return;
			const h = history();
			const isTyping = document.activeElement?.matches("input:not([type=file]):not([type=range]), textarea");
			if (!isTyping || Date.now() - h.time > 700 || h.target !== document.activeElement || !h.past.length)
				h.past = [...h.past.slice(-49), draft.data];
			h.time = isTyping ? Date.now() : 0;
			h.target = document.activeElement;
			h.future = [];
			commit({
				...workspaceRef.current,
				drafts: workspaceRef.current.drafts.map((d) =>
					d.id === draft.id ? { ...d, data: next, updatedAt: new Date().toISOString() } : d,
				),
			});
			setLocalPending(true);
		},
		[commit, lease],
	);
	const travel = (direction: "past" | "future") => {
		if (!writable()) return;
		const h = history();
		const next = h[direction].pop();
		if (!next) return;
		h[direction === "past" ? "future" : "past"].push(current().data);
		h.time = 0;
		updateDraft(current().id, { data: next, updatedAt: new Date().toISOString() });
		setLocalPending(true);
	};
	const guarded = (label: string, action: () => void) => {
		if (!writable()) return false;
		try {
			const backed = withBackup(workspaceRef.current, current().id, label);
			persist(backed);
			commit(backed);
			action();
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "无法创建恢复点，原稿已保留");
			return false;
		}
	};

	const accept = useCallback((next: InitialWorkspace) => {
		storageSnapshot.current = next.storageSnapshot;
		readError.current = next.error;
		conflict.current = false;
		dirty.current = lease.owned && next.storageSnapshot === null && !next.error;
		histories.current.clear();
		commit(next.workspace, false);
		setLocalError(next.error);
		setLocalConflict(false);
		setLocalPending(dirty.current && lease.owned);
	}, [commit, lease]);
	const refreshViewer = useCallback(() => {
		try {
			const raw = localStorage.getItem(WORKSPACE_KEY);
			const next = loadWorkspace(raw);
			if (next) accept({ workspace: next, error: "", storageSnapshot: raw });
			else {
				setLocalError("本机草稿已清除。当前预览仍可下载备份，取得编辑权后可重新开始。");
			}
		} catch {
			setLocalError("无法读取最新草稿，已保留当前预览，请保留浏览器数据。");
		}
	}, [accept]);
	const requestEdit = useCallback(async () => {
		if (lease.owned && editingReady.current) return !readError.current && !conflict.current;
		if (!lease.supported) { setAccessState("unsupported"); return false; }
		const generation = ++activation.current;
		editingReady.current = false;
		setAccessState("checking");
		if (!await lease.acquire()) {
			if (mounted.current && generation === activation.current) setAccessState(lease.supported ? "viewer" : "unsupported");
			return false;
		}
		if (!mounted.current || generation !== activation.current) return false;
		try {
			// A suspended editor may still hold an unsaved draft after a quota error.
			if (dirty.current) {
				if (localStorage.getItem(WORKSPACE_KEY) !== storageSnapshot.current) reportConflict();
			} else {
				const next = await initializeWorkspace();
				if (!mounted.current || generation !== activation.current || !lease.owned) return false;
				accept(next);
			}
			editingReady.current = true;
			setAccessState("editor");
			if (!readError.current && !conflict.current) flushLocal();
			return !readError.current && !conflict.current;
		} catch {
			lease.release();
			setAccessState("viewer");
			setLocalError("暂时无法加载简历，请检查网络后重试。当前预览仍保留。");
			return false;
		}
	}, [accept, flushLocal, lease, reportConflict]);

	useEffect(() => {
		mounted.current = true;
		lease.beforeRelease = () => {
			flushLocal();
			editingReady.current = false;
		};
		// StrictMode cleanup releases ownership; reacquire before enabling input.
		if (!lease.owned && accessState === "editor") void requestEdit();
		let resumeEditing = false;
		const pagehide = () => {
			resumeEditing = lease.owned;
			activation.current += 1;
			lease.release();
			setAccessState(lease.supported ? "viewer" : "unsupported");
		};
		const pageshow = (event: PageTransitionEvent) => {
			if (!event.persisted) return;
			if (resumeEditing) void requestEdit();
			else refreshViewer();
		};
		const hide = () => { if (document.visibilityState === "hidden") flushLocal(); };
		window.addEventListener("pagehide", pagehide);
		window.addEventListener("pageshow", pageshow);
		document.addEventListener("visibilitychange", hide);
		return () => {
			activation.current += 1;
			lease.release();
			lease.beforeRelease = undefined;
			mounted.current = false;
			window.removeEventListener("pagehide", pagehide);
			window.removeEventListener("pageshow", pageshow);
			document.removeEventListener("visibilitychange", hide);
		};
		// accessState is the initial ownership marker, not a lifecycle dependency.
	}, [flushLocal, lease, refreshViewer, requestEdit]);
	useEffect(() => {
		const changed = (event: StorageEvent) => {
			try {
				if (event.storageArea !== localStorage || (event.key !== WORKSPACE_KEY && event.key !== null)) return;
				if (localStorage.getItem(WORKSPACE_KEY) === storageSnapshot.current) return;
				if (lease.owned || dirty.current) reportConflict();
				else refreshViewer();
			} catch { setLocalError("无法读取本机草稿，请保留浏览器数据。"); }
		};
		window.addEventListener("storage", changed);
		return () => window.removeEventListener("storage", changed);
	}, [lease, refreshViewer, reportConflict]);
	useEffect(() => {
		if (!lease.owned || !editingReady.current) return;
		const timer = window.setTimeout(flushLocal, 350);
		return () => window.clearTimeout(timer);
	}, [workspace, accessState, flushLocal, lease]);

	const switchDraft = (id: string) => {
		if (!writable()) return false;
		if (!workspaceRef.current.drafts.some((draft) => draft.id === id)) return false;
		if (!flushLocal()) {
			toast.message("请等待保存完成，或先下载备份");
			return false;
		}
		const next = { ...workspaceRef.current, activeId: id };
		try {
			persist(next);
			commit(next);
			return true;
		} catch {
			toast.error("切换失败，当前简历已保留");
			return false;
		}
	};
	const newDraft = (kind: "blank" | "copy", data?: Resume) => {
		if (!writable()) return false;
		if (!flushLocal()) {
			toast.message("请等待保存完成，或先下载备份");
			return false;
		}
		const draft = createDraft(
			data ?? (kind === "blank" ? emptyResume() : current().data),
			kind === "copy"
				? `${current().name} 副本`
				: data?.basics.name
					? `${data.basics.name}的简历`
					: "未命名简历",
		);
		const next = {
			...workspaceRef.current,
			activeId: draft.id,
			drafts: [...workspaceRef.current.drafts, draft],
		};
		try {
			persist(next);
			commit(next);
			return true;
		} catch {
			toast.error("无法创建简历，请先下载备份并释放存储空间");
			return false;
		}
	};
	return {
		resume: active.data,
		setResume,
		removeWithUndo: (remove: () => void) => {
			if (!writable()) return;
			const id = current().id,
				before = current().data;
			remove();
			const after = current().data;
			toast("已删除", {
				duration: 5000,
				action: {
					label: "撤销",
					onClick: () => {
						if (!writable()) return;
						if (current().id === id) setResume((now) => restoreRemoved(before, after, now));
						else {
							const draft = workspaceRef.current.drafts.find((d) => d.id === id);
							if (draft) updateDraft(id, { data: restoreRemoved(before, after, draft.data) });
						}
					},
				},
			});
		},
		replace: (next: Resume) => guarded("替换前", () => setResume(normalizeResume(next))),
		resetSample: async () => {
			if (!writable()) return false;
			const before = current();
			const generation = activation.current;
			try {
				const sample = await loadSampleResume();
				if (generation !== activation.current || current().id !== before.id || current().data !== before.data) {
					toast.message("加载期间简历已修改，请重新确认重置。");
					return false;
				}
				return guarded("重置前", () => setResume(sample));
			} catch {
				toast.error("示例加载失败，当前内容已保留，请重试。");
				return false;
			}
		},
		undo: () => travel("past"),
		redo: () => travel("future"),
		canUndo: !!writable() && !!histories.current.get(active.id)?.past.length,
		canRedo: !!writable() && !!histories.current.get(active.id)?.future.length,
		accessState,
		canEdit: !!writable() && accessState === "editor",
		requestEdit,
		localError,
		localPending,
		localConflict,
		flushLocal,
		backups: active.backups,
		restore: (id: string) => {
			const b = current().backups.find((b) => b.id === id);
			return b ? guarded("恢复前", () => setResume(b.data)) : false;
		},
		removeBackup: (id: string) => {
			if (!writable()) return;
			const next = {
				...workspaceRef.current,
				drafts: workspaceRef.current.drafts.map((d) =>
					d.id === active.id ? { ...d, backups: d.backups.filter((b) => b.id !== id) } : d,
				),
			};
			try {
				persist(next);
				commit(next);
			} catch {
				toast.error("删除恢复点失败");
			}
		},
		activeId: active.id,
		drafts: workspace.drafts,
		switchDraft,
		newDraft,
		rename: (name: string) => {
			if (!writable()) return;
			updateDraft(active.id, { name: name.trim() || "未命名简历" });
			setLocalPending(true);
		},
	};
}

export type ResumeModel = ReturnType<typeof useResume>;
