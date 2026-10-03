import { ThemeProvider, ThemeToaster } from "@/components/ThemeProvider";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";

const EditorPage = lazy(() =>
	import("@/pages/EditorPage").then((module) => ({ default: module.EditorPage })),
);

const PreviewPage = lazy(() => import("@/pages/PreviewPage").then((module) => ({ default: module.PreviewPage })));

export default function App() {
	useVisualViewport();
	return (
		<ThemeProvider>
			<BrowserRouter>
				<ThemeToaster />
				<WorkspaceProvider>
					<Suspense
						fallback={
							<p role="status" className="p-6 text-center">
								正在打开页面…
							</p>
						}
					>
						<Routes>
							<Route path="/" element={<EditorPage />} />
							<Route path="/editor" element={<EditorPage />} />
							<Route path="/resume" element={<PreviewPage />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</Suspense>
				</WorkspaceProvider>
			</BrowserRouter>
		</ThemeProvider>
	);
}
