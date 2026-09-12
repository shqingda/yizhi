# button

2026-09-12, legacy new-york + transformation engine. Migrated Slot/asChild to the real `@base-ui/react/button` `render` prop. Kept the project's pressable / duration-100 classes.

## Changed

- `src/app/components/ui/button.tsx`: dropped `@radix-ui/react-slot` and `asChild`; wrap `ButtonPrimitive` from `@base-ui/react/button`. Custom classes survived (`pressable`, `transition-[color,background-color,transform] duration-100 ease-out`).
- `src/app/pages/PublicResumePage.tsx`: two `Button asChild` + `<Link>` call sites now use `render={<Link ... />}`.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` on this component's files returned no matches.

## Left alone

- `badge.tsx`, `input.tsx`, `textarea.tsx`: never imported Radix.
- `sonner`: not Radix.

## Behavior changes

None flagged. `render` is the documented Base UI replacement for `asChild`.

## Verify by hand

1. Open `/` error-state or a missing slug and confirm「回到编辑器」is a real link styled as the primary button.
2. On `/r/:slug`, click「编辑」and land on the editor.
3. Press a normal `<Button>` (导出) and confirm the existing press scale still fires.
