import { useEffect, useRef, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { moveItem } from "./ListControls";
import { cn } from "@/lib/utils";

export function SortableList<T>({
	items,
	getId,
	onReorder,
	children,
}: {
	items: T[];
	getId: (item: T) => string;
	onReorder: (next: T[]) => void;
	children: (
		item: T,
		ctx: { handle: ReactNode; index: number; dragging: boolean },
	) => ReactNode;
}) {
	const [announcement, setAnnouncement] = useState("");
	const [dragId, setDragId] = useState<string | null>(null);
	const itemsRef = useRef(items);
	const getIdRef = useRef(getId);
	const onReorderRef = useRef(onReorder);
	const rowRefs = useRef(new Map<string, HTMLElement>());
	itemsRef.current = items;
	getIdRef.current = getId;
	onReorderRef.current = onReorder;

	useEffect(() => {
		if (!dragId) return;

		const move = (event: PointerEvent) => {
			const scroll = rowRefs.current.get(dragId)?.closest<HTMLElement>(".studio-sidebar-form");
			if (scroll) { const bounds = scroll.getBoundingClientRect(); if (event.clientY < bounds.top + 40) scroll.scrollTop -= 12; if (event.clientY > bounds.bottom - 40) scroll.scrollTop += 12; }
			const list = itemsRef.current;
			const from = list.findIndex((item) => getIdRef.current(item) === dragId);
			if (from < 0) return;

			let closest = from;
			let closestDist = Number.POSITIVE_INFINITY;
			for (const [index, item] of list.entries()) {
				const node = rowRefs.current.get(getIdRef.current(item));
				if (!node) continue;
				const rect = node.getBoundingClientRect();
				const dist = Math.abs(event.clientY - (rect.top + rect.height / 2));
				if (dist < closestDist) {
					closestDist = dist;
					closest = index;
				}
			}
			if (closest !== from) onReorderRef.current(moveItem(list, from, closest));
		};

		const stop = () => setDragId(null);
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", stop);
		window.addEventListener("pointercancel", stop);
		return () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", stop);
			window.removeEventListener("pointercancel", stop);
		};
	}, [dragId]);

	return (
		<div className="grid gap-2" data-dragging={dragId ? "true" : "false"}>
			<span className="sr-only" role="status">{announcement}</span>
			{items.map((item, index) => {
				const id = getId(item);
				const dragging = dragId === id;
				return (
					<div
						key={id}
						ref={(node) => {
							if (node) rowRefs.current.set(id, node);
							else rowRefs.current.delete(id);
						}}
					>
						{children(item, {
							index,
							dragging,
							handle: (
								<button
									type="button"
									aria-label={`排序第 ${index + 1} 项，按上下方向键移动`}
									style={{ touchAction: "none" }}
									onKeyDown={event => {
										if (event.key === "Escape") { setDragId(null); return; }
										if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
										event.preventDefault();
										const to = index + (event.key === "ArrowUp" ? -1 : 1);
										if (to < 0 || to >= items.length) return;
										onReorder(moveItem(items, index, to)); setAnnouncement(`已移动到第 ${to + 1} 项`);
									}}
									className={cn(
										"pressable inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-full text-neutral-400",
										"hover:bg-black/5 hover:text-neutral-700",
										dragging && "cursor-grabbing text-neutral-800",
									)}
									onPointerDown={(event) => {
										event.preventDefault();
										setDragId(id);
									}}
								>
									<GripVertical className="size-4" />
								</button>
							),
						})}
					</div>
				);
			})}
		</div>
	);
}
