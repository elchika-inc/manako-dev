---
name: monitor-status
description: This skill should be used when the user asks to "モニターの状態を確認", "monitor status", "監視状態を見せて", "モニター一覧", "monitors list", "稼働状況", "XXXモニターの詳細", "monitor detail", "即座チェック", "trigger check", "ヘルスチェック実行", "モニターのステータス". Retrieves and displays Manako monitor status, details, and triggers immediate checks.
---

# Monitor Status

Manako モニターの状態確認、詳細取得、即座チェックの実行を行う。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__monitors` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し (`MANAKO_API_KEY` 環境変数が必要)

## Operations

### 全モニター概要

ステータスアイコン付きの概要を取得する。

**CLI:**
```bash
manako status
```

**MCP:**
```
mcp__manako__monitors(action: "list")
```

**API:**
```bash
curl -s -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/monitors
```

### モニター一覧 (JSON)

全モニターの詳細 JSON を取得する。

**CLI:**
```bash
manako monitors list
```

**MCP:**
```
mcp__manako__monitors(action: "list", verbose: true)
```

### 個別モニター詳細

特定モニターの詳細情報を取得する。

**CLI:**
```bash
manako monitors get <monitor-id>
```

**MCP:**
```
mcp__manako__monitors(action: "get", id: "<monitor-id>")
```

**API:**
```bash
curl -s -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/monitors/<monitor-id>
```

### 即座チェック

モニターの即座チェックをトリガーし、リアルタイムの結果を取得する。

**CLI:**
```bash
manako monitors check <monitor-id>
```

**MCP:**
```
mcp__manako__monitors(action: "check", id: "<monitor-id>")
```

**API:**
```bash
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/monitors/<monitor-id>/check
```

## Response Fields

| フィールド | 説明 |
|-----------|------|
| `id` | モニター ID (ULID) |
| `name` | モニター名 |
| `type` | タイプ (http, tcp, ping, heartbeat, webchange, ssl, domain) |
| `status` | 現在のステータス (up, down, degraded, unknown, paused) |
| `isActive` | 有効/無効 |
| `intervalSeconds` | チェック間隔 (秒) |
| `lastCheckedAt` | 最終チェック日時 |

## Usage Tips

- `manako status` は概要表示に最適。ステータスアイコン付きで一目で状態がわかる
- 特定モニターの深堀りは `manako monitors get <id>` で JSON を取得
- 設定変更後やインシデント対応中は `manako monitors check <id>` で即座確認
- モニター ID がわからない場合は先に `manako monitors list` で一覧取得
