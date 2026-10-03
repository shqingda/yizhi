/** Keep keyboard navigation in the same list when its focused entry disappears. */
export function removeWithFocus(trigger: HTMLElement, remove: () => void) {
	const entry = trigger.closest<HTMLElement>("[data-editor-entry]");
	const list = entry?.parentElement;
	const rows = list ? [...list.querySelectorAll<HTMLElement>(":scope > [data-editor-entry]")] : [];
	const index = entry ? rows.indexOf(entry) : -1;
	const target = (row?: HTMLElement) => row?.querySelector<HTMLElement>("summary, [data-entry-focus]");
	const candidates = [target(rows[index + 1]), target(rows[index - 1]), list?.querySelector<HTMLElement>(":scope > [data-focus-fallback], :scope > button")];
	remove();
	requestAnimationFrame(() => {
		if (!list?.isConnected || entry?.isConnected || document.activeElement !== document.body) return;
		candidates.find(node => node?.isConnected)?.focus();
	});
}

/** A move can disable its own boundary button; leave focus on the moved card. */
export function moveWithFocus(trigger: HTMLButtonElement, move: () => void) {
	const summary = trigger.closest("[data-editor-entry]")?.querySelector<HTMLElement>("summary");
	move();
	requestAnimationFrame(() => {
		if (summary?.isConnected && trigger.disabled && (document.activeElement === trigger || document.activeElement === document.body)) summary.focus();
	});
}
