import type * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			className={cn(
				"fixed inset-0 z-50 bg-black/50 transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0",
				className,
			)}
			{...props}
		/>
	);
}

function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Popup
				className={cn(
					"fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg transition-[opacity,transform] data-starting-style:opacity-0 data-ending-style:opacity-0 sm:rounded-lg",
					className,
				)}
				{...props}
			>
				{children}
				<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
					<X className="h-4 w-4" />
					<span className="sr-only">关闭</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Popup>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			className={cn("text-lg font-semibold leading-none tracking-tight", className)}
			{...props}
		/>
	);
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
	);
}

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
};
