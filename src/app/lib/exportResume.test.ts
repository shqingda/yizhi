import { describe, expect, it } from "vitest";
import { exportResumePdf } from "./exportResume";

describe("exportResumePdf", () => {
	it("throws when the preview root is missing", async () => {
		await expect(exportResumePdf("multi", "resume.pdf")).rejects.toThrow("未找到简历预览");
		await expect(exportResumePdf("single", "resume.pdf")).rejects.toThrow("未找到简历预览");
	});
});
