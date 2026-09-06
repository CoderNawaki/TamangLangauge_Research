---
name: code-review
description: Review changes along two axes — Standards (coding standards) and Spec (does it match the spec). Both run in parallel.
---

Two-axis review of the diff:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?

## Process

1. Pin the fixed point (commit, branch, tag)
2. Identify the spec source (issue, PRD, or user-provided)
3. Identify standards sources (AGENTS.md, CODING_STANDARDS.md, etc.)
4. Run both reviews
5. Report findings under `## Standards` and `## Spec` headings

## Baseline Code Smells

Even without documented standards, check for:

- **Mysterious Name** — name doesn't reveal purpose
- **Duplicated Code** — same logic in multiple places
- **Feature Envy** — method reaches into another object's data
- **Data Clumps** — same fields travel together
- **Primitive Obsession** — primitive standing in for domain concept
- **Shotgun Surgery** — one change forces scattered edits
- **Speculative Generality** — abstraction for needs that don't exist
