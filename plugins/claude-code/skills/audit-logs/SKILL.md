---
name: audit-logs
description: This skill should be used when the user asks to "監査ログを確認", "view audit logs", "アクセス履歴", "access history", "アクション履歴", "action history", "監査ログ表示", "show audit logs", "who did what". Views and filters Manako audit logs.
---

# Audit Logs

Manako の監査ログを表示・フィルタする。有料プラン専用機能。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__audit_logs` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し

## Operations

### 監査ログ一覧

**CLI:**
```bash
manako audit-logs list
```

**MCP:**
```
mcp__manako__audit_logs(action: "list")
```

**API:**
```bash
curl -s -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/audit-logs
```

### アクションフィルタ

**CLI:**
```bash
manako audit-logs list --action "monitor."
manako audit-logs list --action "team." --limit 20
```

**MCP:**
```
mcp__manako__audit_logs(action: "list", actionFilter: "monitor.", limit: 20)
```

**API:**
```bash
curl -s -H "Authorization: Bearer $MANAKO_API_KEY" \
  "https://api.manako.dev/api/v1/audit-logs?action=monitor.&limit=20"
```

## Available Filters

| パラメータ | 説明 |
|-----------|------|
| `action` | アクション名 (末尾 `.` でプレフィックスマッチ、例: `monitor.`) |
| `resourceType` | monitor, incident, api_key, notification_channel, status_page, team, invitation, team_member, user |
| `userId` | 操作者 ID でフィルタ |
| `from` | 開始日時 (ISO 8601) |
| `to` | 終了日時 (ISO 8601) |
| `limit` | 件数 (1-100, デフォルト 50) |
| `cursor` | ページネーションカーソル |

## Action Categories

| カテゴリ | アクション |
|---------|-----------|
| `user.*` | signup, login, logout |
| `team.*` | update, member.invite, member.invite.cancel, member.invite.accept, member.role.change, member.remove |
| `monitor.*` | create, update, delete |
| `incident.*` | create, update, acknowledge, resolve, delete |
| `api_key.*` | create, delete |
| `notification_channel.*` | create, update, delete |
| `status_page.*` | create, update, delete, custom_domain.create, custom_domain.verify, custom_domain.delete |
| `account.*` | deletion_requested |

## Response Fields

| フィールド | 説明 |
|-----------|------|
| `id` | 監査ログ ID (ULID) |
| `action` | 実行されたアクション名 |
| `resourceType` | 操作対象のリソース種別 |
| `resourceId` | 操作対象のリソース ID |
| `userId` | 操作者のユーザー ID |
| `metadata` | アクション固有の追加情報 |
| `createdAt` | 操作日時 |
| `nextCursor` | 次ページのカーソル (ページネーション) |

## Notes

- 有料プラン専用。無料プランでは 402 が返る
- データ保持期間: 有料プランで 90 日
- 結果は新しい順 (newest-first) で返される
- ページネーションはカーソルベース。レスポンスの `nextCursor` を次リクエストの `cursor` パラメータに指定する
