import { useState } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SortableList } from "@/components/editor/SortableList";
import { useResume } from "@/hooks/useResume";
import { createDraft } from "@/lib/draftStore";
import type { WorkspaceLeaseHandle } from "@/lib/workspaceLease";
import { SAMPLE_RESUME } from "./fixtures";

const animation = vi.hoisted(() => vi.fn());
vi.mock("motion", () => ({ spring: () => {}, animateValue: animation }));
let time = 0, frameId = 0;
let frames: Map<number, FrameRequestCallback>;
const initial = ["邮箱", "电话", "地址", "站点", "生日", "状态"];
const changed = vi.fn();
const capture = new Map<Element, number>();
function frame(ms = 16) {
 act(() => { time += ms; const current = [...frames.values()]; frames.clear(); current.forEach(callback => callback(time)); });
}
function pointer(node: Element | Window, kind: string, y: number, type = "mouse") {
 fireEvent(node, new PointerEvent(kind, { bubbles: true, pointerId: 7, isPrimary: true, button: 0, clientX: 20, clientY: y, pointerType: type }));
}
function List({ disabled = false, revision = initial }: { disabled?: boolean; revision?: string[] }) {
 const [items, setItems] = useState(revision);
 return <div className="studio-sidebar-form"><SortableList items={revision === initial ? items : revision} getId={x => x} getLabel={x => x} disabled={disabled}
  onReorder={next => { changed(next); setItems(next); }}>{(item, { handle }) => <div>{handle}<span>{item}</span></div>}</SortableList></div>;
}
beforeEach(() => {
 time = 0; frameId = 0; frames = new Map(); capture.clear(); changed.mockReset();
 vi.spyOn(performance, "now").mockImplementation(() => time);
 vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; });
 vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
 vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
 Object.defineProperties(HTMLElement.prototype, {
  setPointerCapture: { configurable: true, value(this: Element, id: number) { capture.set(this, id); } },
  hasPointerCapture: { configurable: true, value(this: Element, id: number) { return capture.get(this) === id; } },
  releasePointerCapture: { configurable: true, value(this: Element) { capture.delete(this); } },
 });
 vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function(this: HTMLElement) {
  const scroll = this.closest<HTMLElement>(".studio-sidebar-form");
  const siblings = this.parentElement?.querySelectorAll(".sortable-row") ?? [];
  const index = [...siblings].indexOf(this);
  const translation = Number(this.style.transform.match(/translateY\(([-\d.]+)/)?.[1] ?? 0);
  const top = index < 0 ? 0 : index * 50 + translation - (scroll?.scrollTop ?? 0);
  const height = this.classList.contains("studio-sidebar-form") ? 140 : 40;
  return { top, bottom: top + height, left: 0, right: 300, width: 300, height, x: 0, y: top, toJSON() {} };
 });
 animation.mockReset().mockImplementation(() => ({ stop: vi.fn(), getGeneratorVelocity: () => 42 }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

describe("direct sorting", () => {
 it("highlights immediately, captures the pointer and ignores movement up to 8px", () => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  pointer(handle, "pointerdown", 10); expect(handle).toHaveAttribute("data-pressed", "true");
  expect(handle.hasPointerCapture(7)).toBe(true);
  pointer(window, "pointermove", 18); frame(); pointer(window, "pointerup", 18);
  expect(changed).not.toHaveBeenCalled(); expect(handle.hasPointerCapture(7)).toBe(false);
 });
 it.each(["mouse", "touch"])("follows the %s grab position and commits exactly once on release", type => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  pointer(handle, "pointerdown", 10, type); pointer(window, "pointermove", 70, type);
  expect(handle.closest(".sortable-row")).toHaveStyle({ transform: "translateY(60px)" });
  frame(); expect(changed).not.toHaveBeenCalled();
  pointer(window, "pointerup", 70, type);
  expect(changed).toHaveBeenCalledExactlyOnceWith(["电话", "邮箱", "地址", "站点", "生日", "状态"]);
  expect(view.getByRole("button", { name: /排序邮箱/ })).toHaveFocus();
 });
 it.each(["Escape", "pointercancel", "lostpointercapture"])("cancels %s without persisting a temporary order", reason => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  pointer(handle, "pointerdown", 10); pointer(window, "pointermove", 70);
  if (reason === "Escape") fireEvent.keyDown(window, { key: reason });
  else pointer(reason === "lostpointercapture" ? handle : window, reason, 70);
  pointer(window, "pointerup", 70);
  expect(changed).not.toHaveBeenCalled(); expect(view.getByRole("status")).toHaveTextContent("已取消");
 });
 it.each(["disabled", "draft"])("cancels when %s changes during the gesture", reason => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  pointer(handle, "pointerdown", 10); pointer(window, "pointermove", 70);
  view.rerender(reason === "disabled" ? <List disabled /> : <List revision={[...initial]} />);
  pointer(window, "pointerup", 70); expect(changed).not.toHaveBeenCalled();
 });
 it("keeps scrolling while the pointer is stationary at an edge", () => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  const scroll = view.container.querySelector<HTMLElement>(".studio-sidebar-form")!;
  pointer(handle, "pointerdown", 10); pointer(window, "pointermove", 130);
  const before = scroll.scrollTop; frame(); frame(); frame();
  expect(scroll.scrollTop).toBeGreaterThan(before + 10); expect(changed).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: "Escape" }); const stopped = scroll.scrollTop; frame();
  expect(scroll.scrollTop).toBe(stopped);
 });
 it("lets a fast reversal return to the original position without creating a change", () => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  pointer(handle, "pointerdown", 10); pointer(window, "pointermove", 70); frame();
  pointer(window, "pointermove", 10); frame(); pointer(window, "pointerup", 10);
  expect(changed).not.toHaveBeenCalled();
 });
 it("grabs a settling row from its live position, and hands velocity to a physical spring", () => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  pointer(handle, "pointerdown", 10); pointer(window, "pointermove", 70); frame();
  pointer(window, "pointermove", 80); frame(); pointer(window, "pointerup", 80);
  const options = animation.mock.calls.map(call => call[0]).find(options => options.keyframes[0] > 0 && options.velocity > 0);
  expect(options).toMatchObject({ stiffness: 600, damping: 50, mass: 1 });
  expect(options).not.toHaveProperty("duration");
  act(() => options.onUpdate(12));
  const top = handle.closest(".sortable-row")!.getBoundingClientRect().top;
  pointer(handle, "pointerdown", top + 10); pointer(window, "pointermove", top + 22);
  expect(handle.closest(".sortable-row")!.getBoundingClientRect().top).toBeCloseTo(top + 12);
 });
 it("retains direct tracking but skips settle displacement under reduced motion", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  pointer(handle, "pointerdown", 10); pointer(window, "pointermove", 70);
  expect(handle.closest(".sortable-row")).toHaveStyle({ transform: "translateY(60px)" });
  pointer(window, "pointerup", 70); expect(animation).not.toHaveBeenCalled();
 });
 it("provides named keyboard controls and ignores movements beyond the list boundary", () => {
  const view = render(<List />); const handle = view.getByRole("button", { name: /排序邮箱/ });
  fireEvent.keyDown(handle, { key: "ArrowUp" }); expect(changed).not.toHaveBeenCalled();
  fireEvent.keyDown(handle, { key: "ArrowDown" }); expect(changed).toHaveBeenCalledTimes(1);
  expect(view.getByRole("status")).toHaveTextContent("邮箱已移到第 2 项");
 });
 it("undoes a whole drag in a single step through the workspace model", () => {
  const draft = createDraft(SAMPLE_RESUME);
  const lease: WorkspaceLeaseHandle = { supported: true, owned: true, acquire: async () => true, release() { this.beforeRelease?.(); Object.assign(this, { owned: false }); } };
  function Editor() {
   const m = useResume({ workspace: { version: 2, activeId: draft.id, drafts: [draft] }, error: "", storageSnapshot: null }, lease);
   return <><SortableList items={m.resume.meta.basicsOrder} getId={x => x} getLabel={x => x} onReorder={basicsOrder => m.setResume(r => ({ ...r, meta: { ...r.meta, basicsOrder } }))}>
    {(item, { handle }) => <div>{handle}{item}</div>}</SortableList><button onClick={m.undo} disabled={!m.canUndo}>撤销</button></>;
  }
  const view = render(<Editor />); const first = view.getAllByRole("button")[0];
  pointer(first, "pointerdown", 10); pointer(window, "pointermove", 120); frame(); pointer(window, "pointerup", 120);
  expect(view.getAllByRole("button")[0]).not.toBe(first);
  fireEvent.click(view.getByText("撤销")); expect(view.getAllByRole("button")[0]).toBe(first);
  expect(view.getByText("撤销")).toBeDisabled();
 });
});
