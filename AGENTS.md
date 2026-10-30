# Working on Empires

This is a new TypeScript browser interactive-fiction engine. Use the existing
checkout. No frontend framework is needed.

- Keep this stage limited to validated passages, explicit navigation, and plain
  rendering. Read `docs/ENGINE.md` and `docs/SCRIPTING.md` before changing behavior.
- Passage IDs are authored, unique, and stable. Never derive them from array
  positions, prose, titles, or generated random values.
- `Game` owns the single `GameState`. Rendering reads state; all gameplay changes
  go through the runtime. Enter exactly one destination per player action.
- Story execution must be deterministic. Do not add random execution, procedures,
  subroutines, nested calls, or loops to the story language.
- `GameSnapshot` is a proposed contract for the future pre-passage boundary.
  Do not implement snapshots, Undo, saving, variables, inventory, skills, journal,
  or character creation in this foundation task.
- Render authored content with `textContent`, never as HTML. Keep the UI small,
  keyboard accessible, and free of framework or plugin abstractions.
- System Awakening is reference only. Do not modify it, copy its engine, or reuse
  its save, undo, interpreter, or UI architecture.
- Explicit exclusions: glossary, randomness, shops, skill purchasing, save slots,
  manual saving, import/export, nested calls, loops, complex styling, plugin system.

Use Node.js 22.12+ and run `npm ci`, `npm test`, and `npm run build`. Start with
`npm run dev`. Commit source and the lockfile; `dist/` and `node_modules/` are
generated and ignored. Extend focused tests when changing parsing or navigation.
