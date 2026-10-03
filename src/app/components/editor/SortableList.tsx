import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { animateValue, spring } from "motion";
import { GripVertical } from "lucide-react";
import { moveItem } from "./ListControls";

type RowMotion = { y: number; target: number; animation?: ReturnType<typeof animateValue> };
type Slot = { id: string; top: number; height: number };
type Gesture<T> = {
 items: T[]; id: string; pointer: number; handle: HTMLButtonElement;
 from: number; to: number; startX: number; startY: number; y: number; grab: number;
 started: boolean; slots: Slot[]; gap: number; scroll: HTMLElement | null; scrollStart: number;
 frame: number; time: number; samples: { y: number; time: number }[];
};

export function SortableList<T>({ items, getId, getLabel, onReorder, disabled = false, children }: {
 items: T[]; getId: (item: T) => string; getLabel: (item: T) => string;
 onReorder: (next: T[]) => void; disabled?: boolean;
 children: (item: T, ctx: { handle: ReactNode; index: number; dragging: boolean }) => ReactNode;
}) {
 const [announcement, setAnnouncement] = useState("");
 const [pressed, setPressed] = useState<string | null>(null);
 const [dragging, setDragging] = useState<string | null>(null);
 const props = useRef({ items, getId, getLabel, onReorder, disabled });
 props.current = { items, getId, getLabel, onReorder, disabled };
 const rows = useRef(new Map<string, HTMLDivElement>());
 const motions = useRef(new Map<string, RowMotion>());
 const gesture = useRef<Gesture<T> | null>(null);
 const pending = useRef<{ tops: Map<string, number>; id: string; velocity: number } | null>(null);
 const reduced = useRef(false);
 const motion = useCallback((id: string) => {
  if (!motions.current.has(id)) motions.current.set(id, { y: 0, target: 0 });
  return motions.current.get(id)!;
 }, []);
 const position = useCallback((id: string, y: number) => {
  motion(id).y = y;
  const node = rows.current.get(id);
  if (node) node.style.transform = y ? `translateY(${y}px)` : "";
 }, [motion]);
 const settle = useCallback((id: string, target: number, releaseVelocity?: number) => {
  const m = motion(id);
  if (m.target === target && m.animation && releaseVelocity === undefined) return;
  const velocity = releaseVelocity ?? m.animation?.getGeneratorVelocity() ?? 0;
  m.animation?.stop(); m.target = target;
  if (reduced.current || Math.abs(m.y - target) < 0.1 && Math.abs(velocity) < 1) {
   m.animation = undefined; position(id, target); return;
  }
  m.animation = animateValue({
   keyframes: [m.y, target], type: spring, stiffness: 600, damping: 50, mass: 1,
   velocity, restSpeed: 2, restDelta: 0.1, onUpdate: y => position(id, y),
   onComplete: () => { m.animation = undefined; position(id, target); },
  });
 }, [motion, position]);
 const finish = useCallback((commit: boolean) => {
  const g = gesture.current;
  if (!g) return;
  gesture.current = null; cancelAnimationFrame(g.frame);
  if (g.handle.hasPointerCapture?.(g.pointer)) g.handle.releasePointerCapture(g.pointer);
  setPressed(null); setDragging(null);
  rows.current.get(g.id)?.style.removeProperty("z-index");
  const current = props.current;
  const valid = commit && g.started && !current.disabled && g.items === current.items && g.from !== g.to;
  const recent = g.samples.filter(sample => performance.now() - sample.time <= 80);
  const first = recent[0], last = recent[recent.length - 1];
  const velocity = first && last && last.time > first.time ? (last.y - first.y) * 1000 / (last.time - first.time) : 0;
  if (valid) {
   pending.current = { tops: new Map([...rows.current].map(([id, node]) => [id, node.getBoundingClientRect().top])), id: g.id, velocity };
   current.onReorder(moveItem(g.items, g.from, g.to));
   setAnnouncement(`${current.getLabel(g.items[g.from])}已移到第 ${g.to + 1} 项`);
  } else {
   for (const id of rows.current.keys()) settle(id, 0, id === g.id ? velocity : undefined);
   if (g.started) setAnnouncement(commit ? "顺序未改变" : "已取消排序，顺序未改变");
  }
 }, [settle]);
 const track = useCallback((now: number) => {
  const g = gesture.current;
  if (!g?.started) return;
  const dt = Math.min(32, now - g.time || 16); g.time = now;
  if (g.scroll) {
   const bounds = g.scroll.getBoundingClientRect();
   const edge = Math.min(48, bounds.height / 4);
   const speed = g.y < bounds.top + edge ? -Math.min(1, (bounds.top + edge - g.y) / edge)
    : g.y > bounds.bottom - edge ? Math.min(1, (g.y - bounds.bottom + edge) / edge) : 0;
   g.scroll.scrollTop += speed * 480 * dt / 1000;
  }
  const scrollDelta = (g.scroll?.scrollTop ?? 0) - g.scrollStart;
  const slot = g.slots[g.from];
  const y = g.y - g.grab - slot.top + scrollDelta;
  position(g.id, y);
  g.samples.push({ y, time: now });
  g.samples = g.samples.filter(sample => now - sample.time <= 100);
  const center = slot.top + y + slot.height / 2;
  let to = g.from, distance = Infinity;
  g.slots.forEach((s, index) => {
   const d = Math.abs(center - s.top - s.height / 2);
   if (d < distance) { to = index; distance = d; }
  });
  if (g.to !== to) {
   g.to = to;
   setAnnouncement(`${props.current.getLabel(g.items[g.from])}，第 ${to + 1} 项，松开完成，Escape 取消`);
  }
  let top = g.slots[0].top;
  for (const s of moveItem(g.slots, g.from, to)) {
   if (s.id !== g.id) settle(s.id, top - s.top);
   top += s.height + g.gap;
  }
  g.frame = requestAnimationFrame(track);
 }, [position, settle]);

 useLayoutEffect(() => {
  if (gesture.current && (disabled || gesture.current.items !== items)) finish(false);
  const saved = pending.current;
  if (!saved) return;
  pending.current = null;
  // Rebase the presentation positions after React commits the final DOM order.
  for (const [id, node] of rows.current) {
   const m = motion(id);
   const velocity = id === saved.id ? saved.velocity : m.animation?.getGeneratorVelocity() ?? 0;
   m.animation?.stop(); m.animation = undefined;
   node.style.transform = "";
   const top = node.getBoundingClientRect().top;
   position(id, (saved.tops.get(id) ?? top) - top);
   settle(id, 0, velocity);
  }
 }, [items, disabled, finish, motion, position, settle]);
 useEffect(() => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => {
   reduced.current = preference.matches;
   if (preference.matches) for (const [id, m] of motions.current) {
    if (id === gesture.current?.id) continue;
    m.animation?.stop(); m.animation = undefined; position(id, m.target);
   }
  };
  update(); preference.addEventListener("change", update);
  const move = (e: PointerEvent) => {
   const g = gesture.current;
   if (!g || g.pointer !== e.pointerId) return;
   g.y = e.clientY;
   if (!g.started && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 8) {
    g.started = true; setDragging(g.id);
    const row = rows.current.get(g.id); if (row) row.style.zIndex = "2";
    track(performance.now());
   }
  };
  const up = (e: PointerEvent) => {
   const g = gesture.current;
   if (!g || g.pointer !== e.pointerId) return;
   if (g.started) { g.y = e.clientY; cancelAnimationFrame(g.frame); track(performance.now()); }
   finish(true);
  };
  const cancel = (e: PointerEvent) => { if (gesture.current?.pointer === e.pointerId) finish(false); };
  const key = (e: KeyboardEvent) => { if (e.key === "Escape" && gesture.current) { e.preventDefault(); finish(false); } };
  window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel); window.addEventListener("keydown", key);
  return () => {
   const g = gesture.current; gesture.current = null;
   if (g) { cancelAnimationFrame(g.frame); if (g.handle.hasPointerCapture?.(g.pointer)) g.handle.releasePointerCapture(g.pointer); }
   for (const m of motions.current.values()) m.animation?.stop();
   preference.removeEventListener("change", update);
   window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
   window.removeEventListener("pointercancel", cancel); window.removeEventListener("keydown", key);
  };
 }, [finish, position, track]);

 return <div className="sortable-list grid gap-2" data-dragging={!!dragging}>
  <span className="sr-only" role="status">{announcement}</span>
  {items.map((item, index) => {
   const id = getId(item);
   return <div className="sortable-row" key={id} ref={node => { if (node) rows.current.set(id, node); else rows.current.delete(id); }}>
    {children(item, { index, dragging: dragging === id, handle: <button
     type="button" disabled={disabled} aria-label={`排序${getLabel(item)}，第 ${index + 1} 项，按上下方向键移动`}
     className="sort-handle inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
     data-pressed={pressed === id} style={{ touchAction: "none" }}
     onLostPointerCapture={e => { if (gesture.current?.pointer === e.pointerId) finish(false); }}
     onKeyDown={e => {
      if (disabled || gesture.current || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault(); const to = index + (e.key === "ArrowUp" ? -1 : 1);
      if (to < 0 || to >= items.length) return;
      onReorder(moveItem(items, index, to)); setAnnouncement(`${getLabel(item)}已移到第 ${to + 1} 项`);
     }}
     onPointerDown={e => {
      if (disabled || gesture.current || e.button !== 0 || !e.isPrimary) return;
      e.preventDefault(); e.currentTarget.focus({ preventScroll: true });
      const row = rows.current.get(id)!;
      const bounds = row.getBoundingClientRect();
      const slots = items.map(value => { const key = getId(value), r = rows.current.get(key)!.getBoundingClientRect(); return { id: key, top: r.top - motion(key).y, height: r.height }; });
      const m = motion(id); m.animation?.stop(); m.animation = undefined;
      const scroll = row.closest<HTMLElement>(".studio-sidebar-form");
      e.currentTarget.setPointerCapture(e.pointerId);
      gesture.current = { items, id, pointer: e.pointerId, handle: e.currentTarget, from: index, to: index,
       startX: e.clientX, startY: e.clientY, y: e.clientY, grab: e.clientY - bounds.top, started: false, slots,
       gap: slots.length > 1 ? slots[1].top - slots[0].top - slots[0].height : 0,
       scroll, scrollStart: scroll?.scrollTop ?? 0, frame: 0, time: performance.now(), samples: [] };
      setPressed(id);
     }}
    ><GripVertical className="size-4" /></button> })}
   </div>;
  })}
 </div>;
}
