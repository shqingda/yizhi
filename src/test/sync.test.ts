import { describe, expect, it } from "vitest";
import { isStaleWrite } from "@shared/sync";

describe("isStaleWrite", () => {
	it("allows the first write and a force overwrite", () => {
		expect(isStaleWrite(undefined, "2026-09-13T00:00:00.000Z")).toBe(false);
		expect(isStaleWrite("2026-09-13T00:00:00.000Z", undefined)).toBe(false);
		expect(isStaleWrite("2026-09-13T00:00:00.000Z", "*")).toBe(false);
	});

	it("detects a mismatched version stamp", () => {
		expect(isStaleWrite("2026-09-13T00:00:00.000Z", "2026-09-12T00:00:00.000Z")).toBe(true);
		expect(isStaleWrite("2026-09-13T00:00:00.000Z", '"2026-09-12T00:00:00.000Z"')).toBe(true);
	});

	it("treats a matching stamp as fresh", () => {
		expect(isStaleWrite("2026-09-13T00:00:00.000Z", "2026-09-13T00:00:00.000Z")).toBe(false);
		expect(isStaleWrite("2026-09-13T00:00:00.000Z", '"2026-09-13T00:00:00.000Z"')).toBe(false);
	});
});
