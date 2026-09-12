# project

2026-09-12, whole-project Radix → Base UI. Style is legacy `new-york` (classification only; no `base-new-york` counterpart). Transformation engine on the project's own wrappers. `src/react-app` renamed to `src/app` in the same pass.

## Dependency swap

- Installed `@base-ui/react@1.8.0` alongside Radix, then removed every `@radix-ui/react-*` package after the last wrapper migrated (including unused scroll-area / select / tabs / tooltip — no wrappers existed).
- `components.json` style left as `new-york`. FLAG: future `shadcn add` will still deliver Radix variants unless the style is changed or files are added by hand. There is no `base-new-york`.
- ESLint packages and `eslint.config.js` removed (requested separately). Vite 8.3.0 + TypeScript 7.0.2; `baseUrl` deleted from tsconfigs (TS 7 TS5102).

## App-code sweep

- `asChild` → `render` on Button and DropdownMenu call sites (`PublicResumePage`, `EditorPage`).
- DropdownMenu item `onSelect` → `onClick`.
- Switch `onCheckedChange` left as a single-arg setter.
- No `decorative`, `delayDuration`, `activationMode`, or Select/Tabs consumers.

## Final build

- Baseline `tsc -b` (pre-change, Vite 7 / TS 5.9): passed.
- Post-migration `tsc -b`: passed after removing `baseUrl`.
- `pnpm` reported `ERR_PNPM_IGNORED_BUILDS` for `core-js@3.50.0` (jspdf); packages themselves installed.

## Wrappers remaining on Radix

0 wrappers remain on Radix (`src/app/components/ui` has no `radix-ui` / `@radix-ui` imports).
