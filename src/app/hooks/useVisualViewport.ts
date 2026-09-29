import { useEffect } from "react";

/** Keep scrollable forms and dialogs above the phone's software keyboard. */
export function useVisualViewport() {
	useEffect(() => {
		const viewport = window.visualViewport;
		if (!viewport) return;
		const root = document.documentElement;
		let frame = 0;
		const update = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				// Let the browser handle pinch zoom without resizing the underlying layout.
				if (viewport.scale !== 1) return;
				root.style.setProperty("--visible-height", `${viewport.height}px`);
				root.style.setProperty("--visible-top", `${viewport.offsetTop}px`);
			});
		};
		update();
		viewport.addEventListener("resize", update);
		viewport.addEventListener("scroll", update);
		return () => {
			cancelAnimationFrame(frame);
			viewport.removeEventListener("resize", update);
			viewport.removeEventListener("scroll", update);
			root.style.removeProperty("--visible-height");
			root.style.removeProperty("--visible-top");
		};
	}, []);
}
