# switch

2026-09-12, legacy new-york + transformation engine. 1:1 Root/Thumb rewire. Class hooks updated to `data-checked` / `data-unchecked` / `data-disabled`.

## Changed

- `src/app/components/ui/switch.tsx`: `@radix-ui/react-switch` → `@base-ui/react/switch`. `data-[state=checked|unchecked]` → `data-checked` / `data-unchecked`. `disabled:*` → `data-disabled:*` because Root renders a `<span>`.
- `src/app/components/editor/EditorForms.tsx`: Theme「显示照片」still uses `checked` + `onCheckedChange`. Single-arg handler stays type-safe.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` on this component's files returned no matches.

## Left alone

- Native range input next to the switch in `ThemeForm`.
- `sonner`: not Radix.

## Behavior changes

Root element is now a `<span>` plus hidden `<input>` (Radix used a `<button>`). Keyboard/click should still toggle. `onCheckedChange` gains an `eventDetails` argument that the existing setter ignores.

## Verify by hand

1. Editor → 主题 → toggle「显示照片」.
2. Confirm the preview photo appears/disappears and the thumb slides.
3. Tab to the switch and toggle with Space.
