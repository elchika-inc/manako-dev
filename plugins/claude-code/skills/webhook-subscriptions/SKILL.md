---
name: webhook-subscriptions
description: This skill should be used when the user asks to "Webhookサブスクリプションを管理", "webhook subscriptions", "Webhook設定", "イベント通知の設定", "webhook create", "webhook list", "webhook delete", "Webhookを作成", "Webhookを削除". Manages webhook subscriptions for receiving event notifications.
---

# Webhook Subscriptions

Manako のイベント(インシデント作成/解決、Web変更検知)を外部URLへ通知するWebhookサブスクリプションを管理する。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__webhook-subscriptions` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し (`MANAKO_API_KEY` 環境変数が必要)

## Operations

### サブスクリプション一覧

**CLI:**
```bash
manako webhook-subscriptions list
```

**MCP:**
```
mcp__manako__webhook-subscriptions(action: "list")
```

**API:**
```bash
curl -s -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/webhook-subscriptions
```

### サブスクリプション作成

**CLI:**
```bash
manako webhook-subscriptions create \
  --target-url https://example.com/webhook \
  --secret "your-signing-secret-min16" \
  --events "incident.created,incident.resolved" \
  --description "Production alerts"
```

**MCP:**
```
mcp__manako__webhook-subscriptions(action: "create", targetUrl: "https://example.com/webhook", secret: "your-signing-secret-min16", events: ["incident.created", "incident.resolved"], description: "Production alerts")
```

**API:**
```bash
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://example.com/webhook","secret":"your-signing-secret-min16","events":["incident.created"],"description":"Production alerts"}' \
  https://api.manako.dev/api/v1/webhook-subscriptions
```

### サブスクリプション削除

**CLI:**
```bash
manako webhook-subscriptions rm <subscription-id>
```

**MCP:**
```
mcp__manako__webhook-subscriptions(action: "delete", id: "<subscription-id>")
```

**API:**
```bash
curl -s -X DELETE -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/webhook-subscriptions/<subscription-id>
```

## Available Events

| Event | 説明 |
|-------|------|
| `incident.created` | 新しいインシデントが作成された |
| `incident.resolved` | インシデントが解決された |
| `webchange.detected` | Web変更が検知された |

## Constraints

- targetUrl は HTTPS 必須、パブリックエンドポイントのみ
- secret は16文字以上
- events は最低1つ必要
- レスポンスに secret は含まれない(セキュリティ上)
