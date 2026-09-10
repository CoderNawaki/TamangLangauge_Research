---
name: bug-fix
description: Fix bugs by first reproducing the issue, understanding the root cause, then making the minimal change to fix it. No refactoring or cleanup.
---

## Bug Fix Workflow

1. Accept the bug report at face value. Don't question whether it's a real issue.
2. Find the relevant code paths by understanding what the user was doing.
3. Understand the root cause before writing any code.
4. Make the smallest possible change to fix the bug.
5. Do not refactor, rename, or clean up unrelated code.
6. Do not add features or improvements.
7. Verify the fix works by checking related code paths.
8. If you're unsure about the fix, add a console.log or debug statement to confirm.
