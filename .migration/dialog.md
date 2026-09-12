# dialog

2026-09-12, legacy new-york + transformation engine. Overlay→Backdrop, Content→Popup (no Positioner). Kept the project's simplified overlay (`bg-black/50`) and Chinese close label.

## Changed

- `src/app/components/ui/dialog.tsx`: `@radix-ui/react-dialog` → `@base-ui/react/dialog`. Overlay class `data-[state=open]:animate-in` restated as `transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0`. Close copy remains「关闭」.
- Classification vs new-york golden: customized (dropped fade/zoom/slide stack, `bg-black/50` instead of `/80`, no DialogFooter). Customizations kept; not overwritten with a base-* registry file.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` on this file returned no matches.

## Left alone

- No app page imported Dialog before or after.
- `sonner` toasts are not this primitive.

## Behavior changes

Enter/exit animation is opacity-only CSS transitions instead of tw-animate keyframes. Centered modal still has no Positioner.

## Verify by hand

No current call site. If opened later: Esc closes, overlay click dismisses, focus returns to the trigger, close button is labeled「关闭」.
