import { useEffect, useState, type ReactNode } from "react";
import { useResume } from "@/hooks/useResume";
import { initializeWorkspace, type InitialWorkspace } from "@/lib/initializeWorkspace";

import { WorkspaceContext } from "@/hooks/useWorkspace";
import { WorkspaceLease } from "@/lib/workspaceLease";

function ReadyWorkspace({ initial, lease, children }: { initial: InitialWorkspace; lease: WorkspaceLease; children: ReactNode }) {
	const model = useResume(initial, lease);
	return <WorkspaceContext.Provider value={model}>{children}</WorkspaceContext.Provider>;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState<{ initial: InitialWorkspace; lease: WorkspaceLease } | null>(null);
	const [error, setError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	useEffect(() => {
		let cancelled = false;
		const lease = new WorkspaceLease();
		setError(false);
		lease.acquire().then(() => initializeWorkspace()).then(
			(value) => {
				if (!cancelled) setReady({ initial: value, lease });
				else lease.release();
			},
			() => {
				lease.release();
				if (!cancelled) setError(true);
			},
		);
		return () => {
			cancelled = true;
			lease.release();
		};
	}, [attempt]);
	if (ready) return <ReadyWorkspace {...ready}>{children}</ReadyWorkspace>;
	return (
		<div className="grid min-h-screen place-content-center gap-4 px-6 text-center">
			<p role={error ? "alert" : "status"}>
				{error ? "暂时无法加载示例，请检查网络后重试。" : "正在打开简历…"}
			</p>
			{error && (
				<button className="rounded-lg border px-4 py-2" onClick={() => setAttempt((value) => value + 1)}>
					重新加载
				</button>
			)}
		</div>
	);
}
