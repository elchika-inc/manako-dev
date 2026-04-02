---
description: PR作成前の品質チェックを一括実行する
allowed-tools: Bash, Skill, Read, Glob, Grep, Agent, Task
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Changes from main: !`git diff origin/main...HEAD --stat 2>/dev/null || echo "No commits ahead of main"`

## Pre-flight

If there are no changes from origin/main (no commits ahead, no uncommitted changes), output:

> No changes detected. Nothing to review.

And stop. Do not proceed to the phases.

## Your task

Run all 6 phases below **sequentially**. Do NOT stop on failure -- record the result and continue to the next phase. After all phases, output the final report.

For each phase, output a progress line before starting:

> **Phase N/6: [phase name]...**

### Phase 1: Build

Run `pnpm build` via Bash.

- If exit code is 0: record `PASS`
- If exit code is non-zero: record `FAIL` and capture the error output

### Phase 2: Lint

Run `pnpm lint` via Bash.

- If exit code is 0: record `PASS`
- If exit code is non-zero: record `FAIL` and capture the error output

### Phase 3: Test

Run `pnpm test` via Bash.

- If exit code is 0: record `PASS`
- If exit code is non-zero: record `FAIL` and capture the number of failed tests

### Phase 4: Migration Detection

Check if there are new migration files in the current branch that are not in origin/main:

```bash
git diff origin/main...HEAD --name-only -- packages/db/drizzle/
```

- If no new `.sql` files: record `OK`
- If new `.sql` files found: record `WARN` with the file names. Remind the user to add a `## Migration` section to the PR body describing the SQL changes.

### Phase 5: Documentation Gap Detection

Run these 3 checks using `git diff origin/main...HEAD --name-only`. This phase is **read-only** -- do NOT modify any files.

**Check 1 - API route changes vs openapi.yaml:**

```bash
git diff origin/main...HEAD --name-only -- apps/api/src/routes/
```

If API route files changed but `docs/openapi.yaml` has no diff:

```bash
git diff origin/main...HEAD --name-only -- docs/openapi.yaml
```

Then warn: "API routes changed but docs/openapi.yaml was not updated."

**Check 2 - User-facing changes vs guide docs:**

```bash
git diff origin/main...HEAD --name-only -- apps/api/src/routes/ apps/web/src/
```

If user-facing files changed but no guide docs were updated:

```bash
git diff origin/main...HEAD --name-only -- apps/docs/src/content/docs/guides/
```

Then warn: "User-facing changes detected but no guide documentation was updated."

**Check 3 - CLI/MCP/API changes vs plugin skills:**

```bash
git diff origin/main...HEAD --name-only -- apps/cli/ apps/mcp-server/ apps/api/src/routes/v1/
```

If any of these changed but plugin skills were not updated:

```bash
git diff origin/main...HEAD --name-only -- claude-code-plugin/skills/
```

Then warn: "CLI/MCP/API changes detected but claude-code-plugin skills were not updated."

- If all 3 checks pass: record `OK`
- If any check triggers: record `WARN` with the specific warnings. Recommend the user run `/update-docs` to fix gaps.

### Phase 6: Code Review

Invoke review skills sequentially using the Skill tool:

1. Invoke `pr-review-toolkit:review-pr` to run comprehensive code review
2. Invoke `code-review:code-review` to run security-focused review

- Record `OK` if no critical issues found
- Record `WARN` with a summary of findings (number of critical/important/minor issues from each review)

## Final Report

After all 6 phases complete, output the following report:

```
## Pre-PR Check Report

| Phase | Status | Details |
|-------|--------|---------|
| Build | {PASS or FAIL} | {error details if FAIL, empty if PASS} |
| Lint  | {PASS or FAIL} | {error details if FAIL, empty if PASS} |
| Test  | {PASS or FAIL} | {failed test count if FAIL, empty if PASS} |
| Migration | {OK or WARN} | {file names if WARN, empty if OK} |
| Docs  | {OK or WARN} | {gap descriptions if WARN, empty if OK} |
| Code Review | {OK or WARN} | {issue count summary if WARN, empty if OK} |

### Overall: {READY if Build+Lint+Test all PASS, otherwise NOT READY}
```

If Overall is `NOT READY`, list the FAIL items that need fixing.
If any WARN items exist, list recommended follow-up actions.
