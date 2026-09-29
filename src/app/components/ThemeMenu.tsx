import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";

export type Theme = "system" | "light" | "dark";
const KEY = "yizhi:theme";
function readTheme(): Theme {
	try { const value = localStorage.getItem(KEY); return value === "light" || value === "dark" ? value : "system"; } catch { return "system"; }
}
export function applyTheme(theme: Theme, systemDark: boolean) {
	const dark = theme === "dark" || (theme === "system" && systemDark);
	document.documentElement.classList.toggle("dark", dark);
	document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
export function initializeTheme() { applyTheme(readTheme(), window.matchMedia("(prefers-color-scheme: dark)").matches); }
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: "system", setTheme: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(readTheme);
	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const update = () => applyTheme(theme, media.matches);
		update(); media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, [theme]);
	useEffect(() => {
		const sync = (event: StorageEvent) => { if (event.key === KEY || event.key === null) setTheme(readTheme()); };
		window.addEventListener("storage", sync); return () => window.removeEventListener("storage", sync);
	}, []);
	return <ThemeContext.Provider value={{ theme, setTheme: next => { setTheme(next); try { localStorage.setItem(KEY, next); } catch { /* Keep usable for this session when storage is unavailable. */ } } }}>{children}</ThemeContext.Provider>;
}
export function ThemeMenu() {
	const { theme, setTheme } = useContext(ThemeContext);
	const Icon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;
	return <DropdownMenu><DropdownMenuTrigger render={<Button size="icon" variant="ghost" aria-label="切换主题" title="切换主题" className="rounded-full" />}><Icon /></DropdownMenuTrigger>
		<DropdownMenuContent align="end"><DropdownMenuRadioGroup value={theme} onValueChange={value => setTheme(value as Theme)}>
			<DropdownMenuRadioItem value="light"><Sun />浅色</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="dark"><Moon />深色</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="system"><Monitor />跟随系统</DropdownMenuRadioItem>
		</DropdownMenuRadioGroup></DropdownMenuContent>
	</DropdownMenu>;
}

export function ThemeToaster() { const { theme } = useContext(ThemeContext); return <Toaster theme={theme} position="top-center" richColors />; }
