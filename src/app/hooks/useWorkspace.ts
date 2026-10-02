import { createContext, useContext } from "react";
import type { ResumeModel } from "./useResume";

export const WorkspaceContext = createContext<ResumeModel | null>(null);

export function useWorkspace() {
	const model = useContext(WorkspaceContext);
	if (!model) throw new Error("WorkspaceProvider is required");
	return model;
}

