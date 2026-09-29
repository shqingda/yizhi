/** An existing record requires a matching base version. Force is an explicit API operation. */
export function isStaleWrite(existingUpdatedAt: string | null | undefined, baseUpdatedAt: string | null | undefined): boolean {
	if (!existingUpdatedAt) return false;
	if (!baseUpdatedAt?.trim()) return true;
	return existingUpdatedAt.trim() !== baseUpdatedAt.trim().replace(/^"(.*)"$/, "$1");
}
