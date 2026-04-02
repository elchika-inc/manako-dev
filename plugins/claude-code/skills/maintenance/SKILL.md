---
name: maintenance
description: This skill should be used when the user asks to "メンテナンスモードを設定", "maintenance mode", "メンテナンスを開始", "start maintenance", "メンテナンスを終了", "end maintenance", "一括メンテナンス", "bulk maintenance", "全モニターをメンテナンス". Manages monitor maintenance windows — start/end for single, bulk, or all monitors.
---

# Maintenance

Manako モニターのメンテナンスウィンドウ管理を行う。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__monitors` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し (`MANAKO_API_KEY` 環境変数が必要)

## Operations

### 単一モニターのメンテナンス開始

**CLI:**
```bash
manako monitors maintenance <monitor-id> --duration 60
manako monitors maintenance <monitor-id> --until 2026-04-01T12:00:00Z
```

**MCP:**
```
mcp__manako__monitors(action: "maintenance", id: "<monitor-id>", maintenanceUntil: "2026-04-01T12:00:00Z")
```

**API:**
```bash
# 自動解除あり (デフォルト)
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"maintenanceUntil":"2026-04-01T12:00:00Z"}' \
  https://api.manako.dev/api/v1/monitors/<monitor-id>/maintenance

# 手動解除のみ (autoResolve: false)
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"maintenanceUntil":"2026-04-01T12:00:00Z","autoResolve":false}' \
  https://api.manako.dev/api/v1/monitors/<monitor-id>/maintenance
```

### 単一モニターのメンテナンス終了

**CLI:**
```bash
manako monitors maintenance <monitor-id> --end
```

**MCP:**
```
mcp__manako__monitors(action: "maintenance", id: "<monitor-id>", end: true)
```

**API:**
```bash
curl -s -X DELETE -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/monitors/<monitor-id>/maintenance
```

### 複数モニターの一括メンテナンス開始

**CLI:**
```bash
manako monitors maintenance --ids mon1,mon2,mon3 --duration 30
```

**MCP:**
```
mcp__manako__monitors(action: "maintenance", monitorIds: "mon1,mon2,mon3", maintenanceUntil: "2026-04-01T12:00:00Z")
```

**API:**
```bash
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"monitorIds":["mon1","mon2"],"maintenanceUntil":"2026-04-01T12:00:00Z"}' \
  https://api.manako.dev/api/v1/monitors/bulk/maintenance
```

### 複数モニターの一括メンテナンス終了

**CLI:**
```bash
manako monitors maintenance --ids mon1,mon2,mon3 --end
```

**MCP:**
```
mcp__manako__monitors(action: "maintenance", monitorIds: "mon1,mon2,mon3", end: true)
```

**API:**
```bash
curl -s -X DELETE -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"monitorIds":["mon1","mon2"]}' \
  https://api.manako.dev/api/v1/monitors/bulk/maintenance
```

### 全モニターのメンテナンス開始

**CLI:**
```bash
manako monitors maintenance --all --duration 60
```

**MCP:**
```
mcp__manako__monitors(action: "maintenance", all: true, maintenanceUntil: "2026-04-01T12:00:00Z")
```

**API:**
```bash
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"maintenanceUntil":"2026-04-01T12:00:00Z"}' \
  https://api.manako.dev/api/v1/monitors/all/maintenance
```

### 全モニターのメンテナンス終了

**CLI:**
```bash
manako monitors maintenance --all --end
```

**MCP:**
```
mcp__manako__monitors(action: "maintenance", all: true, end: true)
```

**API:**
```bash
curl -s -X DELETE -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/monitors/all/maintenance
```

## Options

| Option | 説明 |
|--------|------|
| `--duration <minutes>` | メンテナンス期間(分)。未指定時はデフォルト10分 |
| `--until <ISO8601>` | メンテナンス終了日時。最大7日間 |
| `--notify` | メンテナンス開始/終了を通知チャンネルに送信 |
| `--no-auto-resolve` | 終了時刻で自動解除しない(手動解除が必要) |
| `--end` | メンテナンスを終了する |
| `--ids <id1,id2>` | 一括操作対象のモニターID(カンマ区切り、最大100件) |
| `--all` | 全アクティブモニターに適用 |

## Constraints

- メンテナンス最大期間: 7日間 (autoResolve=false の場合は制限なし)
- 一括操作最大ID数: 100
- メンテナンス中のモニターはチェックをスキップし、ステータスページで「メンテナンス中」と表示
