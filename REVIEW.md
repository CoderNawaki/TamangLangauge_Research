# Phase 1 Code Review — Findings & Fixes

Review of the Phase 1 diff (`phase1-core-dictionary`) before merging into `main`.
All fixes target the admin entry form (`frontend/app/admin/page.tsx`).

## Bugs

### B1 — Example key collision on edit (functional bug)
`/frontend/app/admin/page.tsx`

On load-for-edit, `setNextKey(e.senses.length)` (line 109) sets the shared local key
counter to the *number of senses*, but examples inside each sense are keyed `0..n-1`
(line 100). So an entry with 1 sense and 3 examples sets `nextKey = 1`; adding a new
example to that sense uses key `1`, which collides with the already-rendered example
key `1`. React then renders two inputs with the same key → mismatched/duplicated UI.

Fix: derive `nextKey` from the max local key across senses AND their examples (never
reuse keys), instead of `senses.length`.

### B2 — Gloss / Definition (roman) conflated (design defect)
`/frontend/app/admin/page.tsx:357-363`

A single "Gloss / roman" input writes both `definition_roman` and `gloss` from one
field. This makes it impossible to store a Nepali `definition_roman` that differs from
the short gloss. On edit it renders `gloss` while the payload drops `definition_roman`
when empty, causing silent data mismatch.

Fix: split into two separate inputs — `Definition (roman)` and `Gloss`.

## Observations (non-blocking, not changing)
- `list/page.tsx` admin search reuses `fetchEntries(q)`, which now also matches sense
  definitions (reverse lookup). Showing Tamang entries for a Nepali keyword in the admin
  list is acceptable; left as-is.
- `setExample`/`setSense` pick-types don't expose `text_roman` / `translation_devanagari`
  input fields in the UI. Schema already supports them; UI purposely exposes only the two
  main fields. Left as-is for MVP.
- Home page search fires on form submit (not live) and the direction toggle changes only
  the placeholder/results semantic, not the query. Acceptable for MVP.

## Verification performed before merge
- Backend: detail GET, forward + reverse search tested with seeded entries (HTTP 200,
  correct payloads).
- Backend: `pos`/`tone` filters added; no schema change needed.
- Frontend: `npm run build` passes (typecheck clean); routes `/`, `/admin`, `/admin/list`,
  `/entry/[id]` all return 200.
- After fixes: re-run `npm run build` + manual edit-of-multi-example-entry check.
