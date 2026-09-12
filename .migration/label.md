# label

2026-09-12, legacy new-york + transformation engine. No Base UI Label primitive; rewritten to a native `<label>`. Same class string as before.

## Changed

- `src/app/components/ui/label.tsx`: removed `@radix-ui/react-label`. Renders `<label>` with `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui"` on this file returned no matches.

## Left alone

- No app consumers imported `Label` before or after. Forms already use native `<label>` / `Field`.
- `sonner` / input wrappers: not Radix.

## Behavior changes

Radix Label's double-click text-selection guard is gone. The wrapper still has no `select-none`; same as the previous visual classes.

## Verify by hand

No current call site. If a form later uses `<Label htmlFor="...">`, confirm the associated control focuses on click.
