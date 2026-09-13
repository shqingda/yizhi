import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function IconButton({
	label,
	pressed,
	className,
	children,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	label: string;
	pressed?: boolean;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={pressed}
			className={cn(
				"pressable inline-flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-500",
				"hover:bg-black/5 hover:text-neutral-800",
				pressed && "bg-black/5 text-neutral-400",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}

export function VisibilityToggle({
	visible,
	onToggle,
	labelOn = "隐藏",
	labelOff = "显示",
}: {
	visible: boolean;
	onToggle: () => void;
	labelOn?: string;
	labelOff?: string;
}) {
	return (
		<IconButton label={visible ? labelOn : labelOff} pressed={!visible} onClick={onToggle}>
			{visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
		</IconButton>
	);
}

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
