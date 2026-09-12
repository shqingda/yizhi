import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ListControls({
	index,
	total,
	onMove,
	onRemove,
}: {
	index: number;
	total: number;
	onMove: (from: number, to: number) => void;
	onRemove: () => void;
}) {
	return (
		<div className="flex items-center gap-1">
			<Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
				<ArrowUp />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				disabled={index === total - 1}
				onClick={() => onMove(index, index + 1)}
			>
				<ArrowDown />
			</Button>
			<Button type="button" variant="ghost" size="icon" onClick={onRemove}>
				<Trash2 />
			</Button>
		</div>
	);
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
	if (to < 0 || to >= list.length) return list;
	const next = [...list];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className="grid gap-1.5 text-sm">
			<span className="font-medium text-neutral-700">{label}</span>
			{children}
		</label>
	);
}

export function HighlightsEditor({
	value,
	onChange,
}: {
	value: string[];
	onChange: (next: string[]) => void;
}) {
	return (
		<Field label="要点（每行一条）">
			<textarea
				className="flex min-h-23 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				value={value.join("\n")}
				onChange={(event) => onChange(event.target.value.split("\n"))}
				placeholder="一条成绩或职责&#10;另一条要点"
			/>
		</Field>
	);
}
