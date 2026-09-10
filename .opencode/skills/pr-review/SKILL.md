---
name: pr-review
description: Review pull requests focusing on bugs, not style. Flag logic errors, crashes, and broken error handling. Ignore formatting, naming, and preferences.
---

## PR Review Rules

- Only flag actual bugs. Not style, not preferences.
- If you can't reproduce the bug, don't flag it.
- Consider: will this cause a crash? If no, it's not a blocker.
- Check for: logic errors, off-by-one, null/undefined access, missing error handling, race conditions, security issues.
- Read the full file, not just the diff. Context matters.
- Verify async operations have error handling. No silent failures.
