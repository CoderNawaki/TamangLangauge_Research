---
name: refactoring
description: Refactor code to improve readability and consistency without changing behavior. Follow existing patterns, never add dependencies, delete more code than you add.
---

## Refactoring Rules

- The best line of code is the one that doesn't exist. Delete more than you add.
- Prefer flat over nested. Early returns over else chains.
- If you need a comment to explain what the code does, refactor the code instead.
- Use the same libraries and patterns already in the project.
- Don't extract abstractions too early. Wait until 3+ repetitions.
- Write code for humans first. Computers don't care.
- Preserve existing behavior exactly. No hidden fixes or improvements.
