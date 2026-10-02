import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { toast } from "sonner";
import { emptyResume, normalizeResume, type Resume } from "@shared/schema";
import { loadSampleResume } from "@/lib/sampleResume";
import type { InitialWorkspace } from "@/lib/initializeWorkspace";
import {
	restoreRemoved,
	createDraft,
	saveWorkspace,
	withBackup,
	type Draft,
	type Workspace,
} from "@/lib/draftStore";

export function useResume(initial: InitialWorkspace) {
	const [workspace, setWorkspace] = useState(initial.workspace);
	const workspaceRef = useRef(workspace);
	const [localError, setLocalError] = useState(initial.error);
	const [localPending, setLocalPending] = useState(false);
	const mounted = useRef(true);
	const histories = useRef(
		new Map<string, { past: Resume[]; future: Resume[]; time: number; target?: Element | null }>(),
	);
	const active = workspace.drafts.find((d) => d.id === workspace.activeId)!;
	const current = () => workspaceRef.current.drafts.find((d) => d.id === workspaceRef.current.activeId)!;
	const commit = useCallback((next: Workspace) => {
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
	const flushLocal = useCallback(() => {
		if (initial.error) return false;
		try {
			saveWorkspace(workspaceRef.current);
			if (mounted.current) {
				setLocalError("");
				setLocalPending(false);
			}
			return true;
		} catch {
			if (mounted.current) {
				setLocalError("本机保存失败，请下载备份或释放浏览器存储后重试。");
				setLocalPending(false);
			}
			return false;
		}
	}, [initial.error]);
	const history = () => {
		const id = current().id;
		if (!histories.current.has(id)) histories.current.set(id, { past: [], future: [], time: 0 });
		return histories.current.get(id)!;
	};
	const setResume = useCallback(
		(action: SetStateAction<Resume>) => {
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
		[commit],
	);
	const travel = (direction: "past" | "future") => {
		const h = history();
		const next = h[direction].pop();
		if (!next) return;
		h[direction === "past" ? "future" : "past"].push(current().data);
		h.time = 0;
		updateDraft(current().id, { data: next, updatedAt: new Date().toISOString() });
		setLocalPending(true);
	};
	const guarded = (label: string, action: () => void) => {
		try {
			if (initial.error) throw new Error(initial.error);
			const backed = withBackup(workspaceRef.current, current().id, label);
			saveWorkspace(backed);
			commit(backed);
			action();
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "无法创建恢复点，原稿已保留");
			return false;
		}
	};

	useEffect(() => {
		mounted.current = true;
		return () => {
			flushLocal();
			mounted.current = false;
		};
	}, [flushLocal]);
	useEffect(() => {
		const timer = window.setTimeout(flushLocal, 350);
		return () => window.clearTimeout(timer);
	}, [workspace, flushLocal]);
	useEffect(() => {
		const hide = () => {
			if (document.visibilityState === "hidden") flushLocal();
		};
		document.addEventListener("visibilitychange", hide);
		window.addEventListener("pagehide", flushLocal);
		return () => {
			document.removeEventListener("visibilitychange", hide);
			window.removeEventListener("pagehide", flushLocal);
		};
	}, [flushLocal]);

	const switchDraft = (id: string) => {
		if (!workspaceRef.current.drafts.some((draft) => draft.id === id)) return false;
		if (!flushLocal()) {
			toast.message("请等待保存完成，或先下载备份");
			return false;
		}
		const next = { ...workspaceRef.current, activeId: id };
		try {
			saveWorkspace(next);
			commit(next);
			return true;
		} catch {
			toast.error("切换失败，当前简历已保留");
			return false;
		}
	};
	const newDraft = (kind: "blank" | "copy", data?: Resume) => {
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
			saveWorkspace(next);
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
			const id = current().id,
				before = current().data;
			remove();
			const after = current().data;
			toast("已删除", {
				duration: 5000,
				action: {
					label: "撤销",
					onClick: () => {
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
			const before = current();
			try {
				const sample = await loadSampleResume();
				if (current().id !== before.id || current().data !== before.data) {
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
		canUndo: !!histories.current.get(active.id)?.past.length,
		canRedo: !!histories.current.get(active.id)?.future.length,
		localError,
		localPending,
		flushLocal,
		backups: active.backups,
		restore: (id: string) => {
			const b = current().backups.find((b) => b.id === id);
			return b ? guarded("恢复前", () => setResume(b.data)) : false;
		},
		removeBackup: (id: string) => {
			const next = {
				...workspaceRef.current,
				drafts: workspaceRef.current.drafts.map((d) =>
					d.id === active.id ? { ...d, backups: d.backups.filter((b) => b.id !== id) } : d,
				),
			};
			try {
				saveWorkspace(next);
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
			updateDraft(active.id, { name: name.trim() || "未命名简历" });
			setLocalPending(true);
		},
	};
}

export type ResumeModel = ReturnType<typeof useResume>;
