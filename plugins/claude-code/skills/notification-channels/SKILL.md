---
name: notification-channels
description: This skill should be used when the user asks to "通知チャンネルをテスト", "test notification", "テスト通知を送信", "send test notification", "通知の動作確認", "notification channel test". Tests notification channel configuration by sending a test message.
---

# Notification Channels

通知チャンネルのテスト送信を行う。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__notification-channels` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し (`MANAKO_API_KEY` 環境変数が必要)

## Operations

### テスト通知送信

チャンネルの設定が正しいか確認するため、テスト通知を送信する。

**CLI:**
```bash
manako notification-channels test <channel-id>
```

**MCP:**
```
mcp__manako__notification-channels(action: "test", id: "<channel-id>")
```

**API:**
```bash
curl -s -X POST -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/notification-channels/<channel-id>/test
```

## Constraints

- テスト送信にはクールダウンがあり、連続送信はブロックされる
- 無効化されたチャンネルにはテストできない (CHANNEL_INACTIVE エラー)
- 送信失敗時は 502 エラーが返る(チャンネル設定を確認)

## Supported Channels

Email, Slack, Discord, LINE, Webhook, PagerDuty, Datadog, GitHub, Grafana, Jira
