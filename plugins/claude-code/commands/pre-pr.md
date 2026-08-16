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

Run these 4 checks. This phase is **read-only** -- do NOT modify any files.

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
git diff origin/main...HEAD --name-only -- claude-code-plugin/skills/ agent-plugin/skills/ agent-plugin/clawhub.json
```

配布用スキルパッケージは2つある（`claude-code-plugin/` と `agent-plugin/`）。**両方を diff 対象に含めること** — 片方だけ見ると、もう片方に廃止済み API の手順書が残る（AGENTS.md「Agent Plugin Skill Sync」節を参照）。

Then warn: "CLI/MCP/API changes detected but distribution plugin skills (claude-code-plugin / agent-plugin) were not updated."

**Check 4 - 保証台帳:**

索引の実在を検査する:

```bash
bash scripts/check-guarantees.sh
```

- exit 0: 検査を続行する
- non-zero: stderrをそのまま報告し、Docsを`FAIL`にする。exit 0だけを成功として扱う

API routeと台帳全体の粗いco-changeを検査する:

```bash
git diff origin/main...HEAD --name-only -- apps/api/src/routes/
```

```bash
git diff origin/main...HEAD --name-only -- .docs/guarantees.md
```

前者に出力があり後者が空なら、`API routes changed but .docs/guarantees.md was not updated.` と警告する。

続いて、commit済み・未commit・未追跡を含むG-ID行単位のco-changeを検査する:

```bash
bash scripts/check-guarantee-cochange.sh
```

- exit 0: 検査を続行する
- exit 2: stderr の `COCHANGE_WARN:` 行をそのまま報告し、Docsを`WARN`にするがPRはブロックしない
- exit 1またはexit 2以外のnon-zero: stderrをそのまま報告し、Docsを`FAIL`にする

- If all 4 checks pass: record `OK`
- If Check 1〜3、粗いco-change、または行単位co-changeのexit 2がtriggerする: record `WARN` with the specific warnings. Recommend the user run `/update-docs` to fix gaps.
- If `check-guarantees.sh` exits non-zero, or `check-guarantee-cochange.sh` exits with a non-zero other than 2: record `FAIL`. Do not create a PR until the failure is fixed.

### Phase 6: Code Review

Invoke review skills sequentially using the Skill tool:

1. Invoke `pr-review-toolkit:review-pr` to run comprehensive code review
2. Invoke `code-review:code-review` to run security-focused review

- Record `OK` if no flag or optional findings are reported
- If either reviewer reports a confidence 80% or higher Critical / Important flag, record `FAIL` and return to the review cycle for a fix or explicit acceptance before rerunning `/pre-pr`
- Record `WARN` only for optional findings that do not affect correctness, security, or explicit requirements

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
| Docs  | {OK or WARN or FAIL} | {gap descriptions or checker errors, empty if OK} |
| Code Review | {OK or WARN or FAIL} | {issue count summary if WARN or FAIL, empty if OK} |

### Overall: {READY only if Build+Lint+Test all PASS and neither Docs nor Code Review is FAIL, otherwise NOT READY}
```

If Overall is `NOT READY`, list the FAIL items that need fixing.
If any WARN items exist, list recommended follow-up actions.
