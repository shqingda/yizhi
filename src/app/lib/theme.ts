export type Theme = "system" | "light" | "dark";
export const THEME_KEY = "yizhi:theme";
export function readTheme(): Theme {
	try { const value = localStorage.getItem(THEME_KEY); return value === "light" || value === "dark" ? value : "system"; } catch { return "system"; }
}
export function applyTheme(theme: Theme, systemDark: boolean) {
	const dark = theme === "dark" || (theme === "system" && systemDark);
	document.documentElement.classList.toggle("dark", dark);
	document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
export function initializeTheme() { applyTheme(readTheme(), window.matchMedia("(prefers-color-scheme: dark)").matches); }
