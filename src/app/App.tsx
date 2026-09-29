import { useVisualViewport } from "@/hooks/useVisualViewport";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { EditorPage } from "@/pages/EditorPage";
import { PublicResumePage } from "@/pages/PublicResumePage";

export default function App() {
	useVisualViewport();
	return (
		<BrowserRouter>
			<Toaster position="top-center" richColors />
			<Routes>
				<Route path="/" element={<EditorPage />} />
				<Route path="/editor" element={<EditorPage />} />
				<Route path="/resume" element={<PublicResumePage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
