---
name: list-incidents
description: This skill should be used when the user asks to "インシデント一覧", "list incidents", "障害一覧", "進行中のインシデント", "ongoing incidents", "解決済みインシデント", "resolved incidents", "障害状況を確認", "インシデントを見せて", "incident list", "インシデント作成", "create incident", "手動インシデント", "manual incident", "インシデント解決", "resolve incident", "インシデント削除", "delete incident", "インシデント更新", "update incident". Manages Manako incidents: list, create (manual), update, resolve, delete.
---

# Incidents Management

Manako のインシデントを管理する。一覧取得、手動作成、更新、解決、削除に対応。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__incidents` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し

## Operations

### 全インシデント一覧

**CLI:**
```bash
manako incidents list
```

**MCP:**
```
mcp__manako__incidents(action: "list")
```

**API:**
```bash
curl -s -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/incidents
```

### ステータスフィルタ

**進行中のみ:**
```bash
manako incidents list --status ongoing
```

**解決済みのみ:**
```bash
manako incidents list --status resolved
```

**確認済みのみ:**
```bash
manako incidents list --status acknowledged
```

**MCP:**
```
mcp__manako__incidents(action: "list", status: "ongoing")
```

**API:**
```bash
curl -s -H "Authorization: Bearer $MANAKO_API_KEY" \
  "https://api.manako.dev/api/v1/incidents?status=ongoing"
```

## Status Types

| ステータス | 説明 |
|-----------|------|
| `ongoing` | 進行中。モニターが down を検出し、まだ復旧していない |
| `acknowledged` | 確認済み。担当者が認知したが未解決 |
| `resolved` | 解決済み。モニターが復旧を検出、または手動解決 |

## Response Fields

| フィールド | 説明 |
|-----------|------|
| `id` | インシデント ID (ULID) |
| `monitorId` | 関連モニター ID |
| `type` | インシデントタイプ |
| `status` | ステータス (ongoing, acknowledged, resolved) |
| `title` | インシデントタイトル |
| `startedAt` | 発生日時 |
| `resolvedAt` | 解決日時 (resolved の場合) |

### 手動インシデント作成

モニターに紐付かない手動インシデントを作成する。

**CLI:**
```bash
manako incidents create --title "Payment service outage" --cause "Provider issue"
```

**MCP:**
```
mcp__manako__incidents(action: "create", title: "Payment service outage", cause: "Provider issue")
```

**API:**
```bash
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Payment service outage", "cause": "Provider issue"}' \
  https://api.manako.dev/api/v1/incidents
```

### インシデント更新

タイトルや原因を更新する。`--title` か `--cause` のいずれかが必須。

**CLI:**
```bash
manako incidents update <incident-id> --title "Updated title" --cause "More details"
```

**MCP:**
```
mcp__manako__incidents(action: "update", id: "<incident-id>", title: "Updated title", cause: "More details")
```

**API:**
```bash
curl -s -X PUT -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "cause": "More details"}' \
  https://api.manako.dev/api/v1/incidents/<incident-id>
```

### インシデント解決

インシデントを手動で解決する。

**CLI:**
```bash
manako incidents resolve <incident-id> --cause "Root cause identified and fixed"
```

**MCP:**
```
mcp__manako__incidents(action: "resolve", id: "<incident-id>", cause: "Root cause identified and fixed")
```

**API:**
```bash
curl -s -X PUT -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"cause": "Root cause identified and fixed"}' \
  https://api.manako.dev/api/v1/incidents/<incident-id>/resolve
```

### インシデント削除

手動作成したインシデントを削除する。モニター検出のインシデントは削除不可。

**CLI:**
```bash
manako incidents delete <incident-id>
```

**MCP:**
```
mcp__manako__incidents(action: "delete", id: "<incident-id>")
```

**API:**
```bash
curl -s -X DELETE -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/incidents/<incident-id>
```

## Usage Tips

- 障害対応時はまず `--status ongoing` で進行中のインシデントを確認
- インシデント ID は `acknowledge-incident` スキルで確認済みマークに使用
- CLI 出力ではインシデント ID は先頭 12 文字のみ表示される。完全な ID は JSON 出力で取得可能
- 手動インシデント作成時、`--title` は必須。`--cause` は任意
- 削除は手動作成 (type: "manual") のインシデントのみ可能。モニター検出のインシデントは削除できない
- resolve はステータスが ongoing または acknowledged のインシデントに対してのみ有効
