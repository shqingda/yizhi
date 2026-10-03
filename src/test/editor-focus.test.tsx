import { useState } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EditorActions, EntryCard, ListControls, moveItem } from "@/components/editor/ListControls";
import { CustomSectionsForm } from "@/components/editor/forms/CustomSectionsForm";
import { SAMPLE_RESUME } from "./fixtures";
import type { Resume } from "@shared/schema";

let frames: FrameRequestCallback[];
beforeEach(() => {
	frames = [];
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function frame() { act(() => { const pending = frames.splice(0); pending.forEach(callback => callback(0)); }); }

function Entries({ initial = ["甲", "乙", "丙"], locked = false }: { initial?: string[]; locked?: boolean }) {
	const [items, setItems] = useState(initial);
	return <EditorActions.Provider value={{ remove: action => { if (!locked) action(); } }}>
		<div>{items.map((item, index) => <EntryCard key={item} title={item} onCopy={() => {}}>
			<ListControls label={item} index={index} total={items.length} onMove={(from, to) => setItems(moveItem(items, from, to))} onRemove={() => setItems(items.filter(x => x !== item))} />
		</EntryCard>)}<button>添加条目</button></div><button>其他操作</button>
	</EditorActions.Provider>;
}

it.each([["甲", "乙"], ["乙", "丙"], ["丙", "乙"]])("returns focus from deleted %s to adjacent %s", (removed, next) => {
	const view = render(<Entries />);
	const button = view.getByRole("button", { name: `删除${removed}` });
	button.focus(); fireEvent.click(button); frame();
	expect(view.getByText(next, { selector: "summary" })).toHaveFocus();
});

it("returns to add when the final entry is deleted", () => {
	const view = render(<Entries initial={["甲"]} />);
	const button = view.getByRole("button", { name: "删除甲" });
	button.focus(); fireEvent.click(button); frame();
	expect(view.getByRole("button", { name: "添加条目" })).toHaveFocus();
});

it("does not move focus when permission rejects deletion", () => {
	const view = render(<Entries locked />);
	const button = view.getByRole("button", { name: "删除甲" });
	button.focus(); fireEvent.click(button); frame();
	expect(button).toHaveFocus();
});

it("does not steal focus if the user moves elsewhere before the next frame", () => {
	const view = render(<Entries />);
	const button = view.getByRole("button", { name: "删除甲" });
	button.focus(); fireEvent.click(button);
	const other = view.getByRole("button", { name: "其他操作" }); other.focus(); frame();
	expect(other).toHaveFocus();
});

it("keeps the moved card focused when its move button becomes disabled", () => {
	const view = render(<Entries />);
	const button = view.getByRole("button", { name: "上移乙" });
	button.focus(); fireEvent.click(button); frame();
	expect(button).toBeDisabled();
	expect(view.getByText("乙", { selector: "summary" })).toHaveFocus();
});

it("restores focus within nested custom items and then the outer section list", () => {
	function Custom() {
		const [resume, setResume] = useState<Resume>(() => ({ ...SAMPLE_RESUME, customSections: [
			{ id: "one", title: "志愿活动", items: [{ id: "a", title: "志愿者", highlights: [] }, { id: "b", title: "负责人", highlights: [] }] },
			{ id: "two", title: "其他", items: [] },
		] }));
		return <CustomSectionsForm resume={resume} setResume={setResume} />;
	}
	const view = render(<Custom />);
	for (const [label, target] of [["删除志愿者", "负责人"], ["删除志愿活动", "其他"]]) {
		const button = view.getByRole("button", { name: label }); button.focus(); fireEvent.click(button); frame();
		expect(view.getByDisplayValue(target)).toHaveFocus();
	}
	const button = view.getByRole("button", { name: "删除其他" }); button.focus(); fireEvent.click(button); frame();
	expect(view.getByRole("button", { name: "添加自定义区块" })).toHaveFocus();
});
