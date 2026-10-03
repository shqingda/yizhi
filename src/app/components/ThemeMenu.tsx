import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";

import { useTheme } from "./ThemeProvider";
import type { Theme } from "@/lib/theme";

export function ThemeMenu() {
	const { theme, setTheme } = useTheme();
	const Icon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;
	return <DropdownMenu><DropdownMenuTrigger render={<Button size="icon" variant="ghost" aria-label="切换主题" title="切换主题" className="rounded-full" />}><Icon /></DropdownMenuTrigger>
		<DropdownMenuContent align="end"><DropdownMenuRadioGroup value={theme} onValueChange={value => setTheme(value as Theme)}>
			<DropdownMenuRadioItem value="light"><Sun />浅色</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="dark"><Moon />深色</DropdownMenuRadioItem>
			<DropdownMenuRadioItem value="system"><Monitor />跟随系统</DropdownMenuRadioItem>
		</DropdownMenuRadioGroup></DropdownMenuContent>
	</DropdownMenu>;
}
