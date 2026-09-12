# dropdown-menu

2026-09-12, legacy new-york + transformation engine. DropdownMenu → Menu. Content is Portal > Positioner > Popup. Label → GroupLabel. `align` / `side` / offsets are forwarded to Positioner.

## Changed

- `src/app/components/ui/dropdown-menu.tsx`: `@radix-ui/react-dropdown-menu` → `@base-ui/react/menu`. Kept the custom panel (`rounded-xl`, `bg-white/92`, `backdrop-blur-xl`, `sideOffset` default 8). Positioner gets `isolate z-50 outline-none`. `DropdownMenuLabel` wraps `Group` + `GroupLabel` because Base UI 1.8 throws if GroupLabel is used alone.
- `src/app/pages/EditorPage.tsx`: `DropdownMenuTrigger asChild` → `render={<Button ... />}`. `DropdownMenuItem asChild` + `<Link>` → `render={<Link ... />}`. Item `onSelect` → `onClick`.
- Shared consumer-sweep note: every leftover `asChild` / `onSelect` in app code for this menu was updated in EditorPage.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` on this component's files returned no matches.

## Left alone

- `sonner` (not Radix).
- No submenu / checkbox / radio items existed; those parts were not added.

## Behavior changes

- Regular items still close on click (`closeOnClick` default true on Item). Not patched.
- `onSelect` preventDefault-to-keep-open is gone; none of the call sites used it.
- `Menu.GroupLabel` requires `<Menu.Group>`. The wrapper now nests Group + GroupLabel so existing call sites keep working.

## Verify by hand

1. Editor header: click ⋯, menu opens aligned to the right.
2. Arrow keys move highlight; typeahead is unused (short list).
3. 「打开公开页」navigates. 导出 JSON / 导入 JSON / 保存 / 重置 still run.
4. Click outside or Esc closes the menu.
