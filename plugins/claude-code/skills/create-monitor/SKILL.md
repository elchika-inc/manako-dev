---
name: create-monitor
description: This skill should be used when the user asks to "モニターを作成", "create monitor", "監視を追加", "XXXを監視して", "XXXのHTTP監視を作って", "ヘルスチェックを設定", "add monitor", "モニターを追加", "SSL監視", "ドメイン監視", "Web変更検知を設定". Creates new Manako monitors with type-specific configuration.
---

# Create Monitor

新しい Manako モニターを作成する。7 種類のモニタータイプに対応。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__monitors` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し

## Quick Start

最も一般的な HTTP モニター作成:

**CLI:**
```bash
manako monitors add https://example.com --name "Example Site" --type http --interval 300
```

**MCP:**
```
mcp__manako__monitors(action: "create", name: "Example Site", type: "http", url: "https://example.com", intervalSeconds: 300)
```

**API:**
```bash
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"http","name":"Example Site","config":{"url":"https://example.com","method":"GET","expectedStatus":200,"timeoutMs":10000},"intervalSeconds":300}' \
  https://api.manako.dev/api/v1/monitors
```

## Monitor Types Overview

| タイプ | 用途 | CLI target 例 |
|--------|------|---------------|
| `http` | Web サイト/API の死活監視 | `https://example.com` |
| `tcp` | ポート接続確認 | `example.com` (+ `--config`) |
| `ping` | Ping 応答確認 | `example.com` |
| `heartbeat` | cron/バッチの生存確認 | `heartbeat` (ダミー) |
| `webchange` | Web ページの変更検知 | `https://example.com` |
| `ssl` | SSL 証明書の期限監視 | `example.com` |
| `domain` | ドメインの期限監視 | `example.com` |

各タイプの config 詳細は `references/monitor-types.md` を参照。

## CLI Examples by Type

```bash
# HTTP
manako monitors add https://api.example.com/health --name "API Health" --type http

# TCP
manako monitors add example.com --name "SSH" --type tcp \
  --config '{"hostname":"example.com","port":22,"timeoutMs":10000}'

# Heartbeat
manako monitors add heartbeat --name "Nightly Batch" --type heartbeat \
  --config '{"graceSeconds":300}'

# SSL
manako monitors add example.com --name "SSL Cert" --type ssl \
  --config '{"hostname":"example.com","warnDays":[30,14,7,1]}'

# Domain
manako monitors add example.com --name "Domain Expiry" --type domain \
  --config '{"domain":"example.com","warnDays":[30,14,7]}'

# Web Change (text - Free プラン可)
manako monitors add https://example.com --name "Price Watch" --type webchange \
  --config '{"url":"https://example.com/pricing","selector":".price","checkType":"text"}'

# Web Change (screenshot - Paid プランのみ, 最小 1800s 間隔)
manako monitors add https://example.com --name "Visual Diff" --type webchange \
  --config '{"url":"https://example.com","checkType":"screenshot"}' --interval 1800
```

## Parameters

| パラメータ | 必須 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `target` (CLI) / `url` (MCP) | Yes | - | 監視対象 URL またはホスト名 |
| `--name` / `name` | No | target の値 | モニター名 |
| `--type` / `type` | No | `http` | モニタータイプ |
| `--interval` / `intervalSeconds` | No | `300` | チェック間隔 (60-86400 秒) |
| `--config` / `config` | No | 自動生成 | タイプ別設定 JSON |

## Constraints

- チェック間隔: Free プランでは最小 300 秒、Paid プランでは最小 60 秒。最大 86400 秒 (24 時間)
- Free プランではモニター数に上限あり (`PLAN_LIMITS.free.maxMonitors`)
- モニター名は必須ではないが、設定すると管理しやすい
- WebChange の `checkType`:
  - `text`: Free / Paid プラン利用可。`selector` が必須
  - `screenshot`: Paid プランのみ。最小間隔 1800 秒 (30分)。`selector` は不要
  - `both`: Paid プランのみ。最小間隔 1800 秒 (30分)。`selector` が必須
  - Free プランで `screenshot` または `both` を指定すると 402 エラー

## Additional Resources

### Reference Files

タイプ別の config フィールド詳細:
- **`references/monitor-types.md`** - 全 7 タイプの config スキーマと設定例
