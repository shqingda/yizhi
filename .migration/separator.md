# separator

2026-09-12, legacy new-york + transformation engine. Rewired to callable `@base-ui/react/separator`. Dropped `decorative`. Kept `h-px` / `w-px` classes.

## Changed

- `src/app/components/ui/separator.tsx`: `@radix-ui/react-separator` → `@base-ui/react/separator`. `decorative` removed (no Base UI equivalent). Orientation + size classes unchanged.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` on this file returned no matches.

## Left alone

- `DropdownMenuSeparator` lives in `dropdown-menu.tsx` (Menu.Separator), not this wrapper.
- No app file imported `ui/separator` before or after.

## Behavior changes

Base UI Separator is always semantic (`role="separator"`). The old default `decorative={true}` is gone. Unused in app code today.

## Verify by hand

No current call site. If added later, check horizontal vs vertical thickness (`h-px` / `w-px`) and that screen readers announce a separator.
