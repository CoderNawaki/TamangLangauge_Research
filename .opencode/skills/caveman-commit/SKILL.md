---
name: caveman-commit
description: >
  Ultra-compressed commit message generator. Conventional Commits format.
  Subject ≤50 chars, body only when "why" isn't obvious.
---

Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what.

## Rules

**Subject line:**
- `<type>(<scope>): <imperative summary>` — `<scope>` optional
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative mood: "add", "fix", "remove" — not "added", "adds", "adding"
- ≤50 chars when possible, hard cap 72
- No trailing period

**Body (only if needed):**
- Skip entirely when subject is self-explanatory
- Add body only for: non-obvious *why*, breaking changes, migration notes, linked issues
- Wrap at 72 chars
- Bullets `-` not `*`
- Reference issues/PRs at end: `Closes #42`, `Refs #17`

**What NEVER goes in:**
- "This commit does X", "I", "we", "now", "currently"
- Emoji (unless project convention requires)
- Restating the file name when scope already says it

## Examples

- ❌ "feat: add a new endpoint to get user profile information from the database"
- ✅ "feat(api): add GET /users/:id/profile"
