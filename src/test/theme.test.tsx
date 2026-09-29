import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { initializeTheme, ThemeProvider } from "@/components/ThemeMenu";

afterEach(() => { cleanup(); localStorage.clear(); document.documentElement.classList.remove("dark"); document.documentElement.style.colorScheme = ""; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function media(dark: boolean) {
 const target = Object.assign(new EventTarget(), { matches: dark });
 vi.stubGlobal("matchMedia", () => target);
 return target;
}
it("defaults to system, follows live changes and removes its listener on unmount", () => {
 const target = media(true);
 initializeTheme(); expect(document.documentElement).toHaveClass("dark");
 const view = render(<ThemeProvider><div /></ThemeProvider>);
 act(() => { target.matches = false; target.dispatchEvent(new Event("change")); });
 expect(document.documentElement).not.toHaveClass("dark");
 view.unmount(); target.matches = true; target.dispatchEvent(new Event("change"));
 expect(document.documentElement).not.toHaveClass("dark");
});
it("restores explicit preference and ignores system changes until system is selected", () => {
 const target = media(true); localStorage.setItem("yizhi:theme", "light");
 initializeTheme(); render(<ThemeProvider><div /></ThemeProvider>);
 act(() => target.dispatchEvent(new Event("change")));
 expect(document.documentElement).not.toHaveClass("dark");
 act(() => { localStorage.setItem("yizhi:theme", "system"); window.dispatchEvent(new StorageEvent("storage", { key: "yizhi:theme" })); });
 expect(document.documentElement).toHaveClass("dark");
});
it("falls back to system when reading storage fails", () => {
 media(true); vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
 expect(() => initializeTheme()).not.toThrow();
 expect(document.documentElement).toHaveClass("dark");
});
