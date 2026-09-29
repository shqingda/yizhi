import { createContext, useContext, useEffect, useRef, useId, isValidElement, cloneElement, type ReactElement, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const EditorActions = createContext({ remove: (action: () => void) => action() });

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
	const { remove } = useContext(EditorActions);
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={pressed}
			className={cn(
				"pressable inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground",
				"hover:bg-secondary hover:text-foreground",
				pressed && "bg-secondary text-muted-foreground",
				className,
			)}
			{...props}
			onClick={event => { if (label.startsWith("删除")) remove(() => props.onClick?.(event)); else props.onClick?.(event); }}
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
	const { remove } = useContext(EditorActions);
	return (
		<div className="flex items-center gap-1">
			<Button type="button" variant="ghost" size="icon" aria-label="上移条目" title="上移" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
				<ArrowUp />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label="下移条目" title="下移" disabled={index === total - 1}
				onClick={() => onMove(index, index + 1)}
			>
				<ArrowDown />
			</Button>
			<Button type="button" variant="ghost" size="icon" aria-label="删除条目" title="删除" onClick={() => remove(onRemove)}>
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
	const id = useId();
	return <div className="flex min-w-0 flex-col gap-1.5 text-sm"><label htmlFor={id} className="font-medium text-foreground">{label}</label>{isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}</div>;
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
				placeholder="做了什么、采用什么方法、取得什么结果（每行一条）"
			/>
		</Field>
	);
}

export function EntryCard({ title, onCopy, children }: { title: string; onCopy: () => void; children: ReactNode }) {
	const ref = useRef<HTMLDetailsElement>(null);
	useEffect(() => {
		if (!title) { ref.current?.scrollIntoView?.({ block: "nearest" }); ref.current?.querySelector<HTMLInputElement>("input")?.focus(); }
	}, []);
	return <details ref={ref} open className="editor-entry min-w-0 rounded-xl border border-black/8 bg-card p-3">
		<summary className="mb-3 cursor-pointer text-sm font-medium leading-6 [overflow-wrap:anywhere]">{title || "新增条目"}</summary>
		<button type="button" onClick={onCopy} className="float-left mb-2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">复制此条目</button>
		{children}
	</details>;
}
