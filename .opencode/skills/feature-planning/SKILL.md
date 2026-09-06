---
name: feature-planning
description: Plan features by exploring the codebase first, understanding existing patterns, then proposing a minimal implementation plan before writing code.
---

## Feature Planning Workflow

1. Explore the codebase to understand existing patterns and conventions.
2. Check what libraries and tools are already in use — don't add new ones.
3. Identify the minimal change needed. What's the smallest thing that works?
4. Propose a plan before writing code.
5. Keep scope narrow. One feature per branch.
6. Prefer the existing pattern over a "better" one. Consistency > perfection.
7. Don't extract abstractions too early. Wait until there are 3+ repetitions.
8. No comments. Write self-documenting code.
