/** True when the client is saving from a stale cloud snapshot. */
export function isStaleWrite(
	existingUpdatedAt: string | null | undefined,
	baseUpdatedAt: string | null | undefined,
): boolean {
	if (!existingUpdatedAt || !baseUpdatedAt) return false;
	const existing = existingUpdatedAt.trim();
	const base = baseUpdatedAt.trim().replace(/"/g, "");
	if (!existing || !base || base === "*") return false;
	return existing !== base;
}
