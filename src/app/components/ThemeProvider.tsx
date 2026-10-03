import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { readTheme, applyTheme, THEME_KEY, type Theme } from "@/lib/theme";

export const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: "system", setTheme: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(readTheme);
	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const update = () => applyTheme(theme, media.matches);
		update(); media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, [theme]);
	useEffect(() => {
		const sync = (event: StorageEvent) => { if (event.key === THEME_KEY || event.key === null) setTheme(readTheme()); };
		window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
	}, []);
	return <ThemeContext.Provider value={{ theme, setTheme: next => { setTheme(next); try { localStorage.setItem(THEME_KEY, next); } catch { /* Keep usable for this session when storage is unavailable. */ } } }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }

export function ThemeToaster() { const { theme } = useContext(ThemeContext); return <Toaster theme={theme} position="top-center" richColors />; }
