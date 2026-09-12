import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

function DropdownMenuContent({
	className,
	align,
	alignOffset,
	side,
	sideOffset = 8,
	...props
}: DropdownMenuPrimitive.Popup.Props &
	Pick<DropdownMenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Positioner
				className="isolate z-50 outline-none"
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
			>
				<DropdownMenuPrimitive.Popup
					className={cn(
						"z-50 min-w-52 overflow-hidden rounded-xl border border-black/8 bg-white/92 p-1 shadow-[0_18px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl",
						className,
					)}
					{...props}
				/>
			</DropdownMenuPrimitive.Positioner>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuItem({ className, ...props }: DropdownMenuPrimitive.Item.Props) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				"flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none [&_svg]:size-4",
				"transition-colors duration-100 focus:bg-neutral-100 data-disabled:pointer-events-none data-disabled:opacity-40",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuSeparator({ className, ...props }: DropdownMenuPrimitive.Separator.Props) {
	return <DropdownMenuPrimitive.Separator className={cn("my-1 h-px bg-black/8", className)} {...props} />;
}

function DropdownMenuLabel({ className, ...props }: DropdownMenuPrimitive.GroupLabel.Props) {
	return (
		<DropdownMenuPrimitive.Group>
			<DropdownMenuPrimitive.GroupLabel
				className={cn("px-2.5 py-1.5 text-xs text-neutral-500", className)}
				{...props}
			/>
		</DropdownMenuPrimitive.Group>
	);
}

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuLabel,
	DropdownMenuGroup,
};
