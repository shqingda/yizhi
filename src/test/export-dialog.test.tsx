import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ExportDialog } from "@/components/ExportDialog";
import { exportResumePdf } from "@/lib/exportResume";
import { SAMPLE_RESUME } from "./fixtures";
import type { Resume } from "@shared/schema";

vi.mock("@/lib/exportResume", () => ({ exportResumePdf: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/components/resume/ResumeDocument", () => ({ ResumeDocument: ({ resume }: { resume: Resume }) =>
 <article className="resume-print-root" data-layout={resume.meta.layoutMode}>{resume.basics.name}</article> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("exports an isolated copy without changing the draft, and keeps it stable across saved updates", async () => {
 const resume = structuredClone(SAMPLE_RESUME); resume.meta.layoutMode = "single";
 const before = JSON.stringify(resume), save = vi.spyOn(Storage.prototype, "setItem"), closed = vi.fn();
 const view = render(<ExportDialog resume={resume} onClose={closed} />);
 fireEvent.change(view.getByRole("combobox", { name: "导出格式" }), { target: { value: "multi" } });
 expect(JSON.stringify(resume)).toBe(before); expect(save).not.toHaveBeenCalled();
 view.rerender(<ExportDialog resume={{ ...resume, basics: { ...resume.basics, name: "New saved revision" } }} onClose={closed} />);
 fireEvent.click(view.getByRole("button", { name: "打开打印窗口" }));
 await waitFor(() => expect(closed).toHaveBeenCalledOnce());
 const call = vi.mocked(exportResumePdf).mock.calls[0];
 expect(call[0]).toBe("multi");
 expect(call[2]).toHaveAttribute("data-layout", "multi");
 expect(call[2]).toHaveTextContent(resume.basics.name);
 expect(call[2]).not.toHaveTextContent("New saved revision");
 expect(save).not.toHaveBeenCalled();
});
