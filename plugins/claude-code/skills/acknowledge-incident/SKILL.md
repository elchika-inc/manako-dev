---
name: acknowledge-incident
description: This skill should be used when the user asks to "インシデントを確認済みにして", "acknowledge incident", "ack incident", "インシデントXXXをack", "インシデントに対応済みマーク", "障害を確認済みにする", "incident acknowledge", "インシデント対応", "インシデント解決", "resolve incident". Acknowledges or resolves a Manako incident.
---

# Acknowledge / Resolve Incident

Manako のインシデントを確認済み (acknowledged) にマーク、または手動で解決 (resolved) にする。

## Tool Detection

1. Bash で `which manako` を実行 → 成功なら CLI を使用
2. ツール一覧に `mcp__manako__incidents` が存在するか確認 → あれば MCP を使用
3. いずれもなければ `curl` で API を直接呼び出し

## Operation

### Acknowledge

**CLI:**
```bash
manako incidents ack <incident-id>
```

**MCP:**
```
mcp__manako__incidents(action: "acknowledge", id: "<incident-id>")
```

**API:**
```bash
curl -s -X PUT -H "Authorization: Bearer $MANAKO_API_KEY" \
  https://api.manako.dev/api/v1/incidents/<incident-id>/acknowledge
```

### Resolve

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

## Workflow

典型的なインシデント対応フロー:

1. インシデント発生の通知を受ける
2. `list-incidents` スキルで進行中のインシデントを確認
3. 対象インシデントの ID を特定
4. `manako incidents ack <id>` で確認済みマーク
5. 原因調査・対応を実施
6. モニターが復旧を検出すると自動で resolved に移行、または `manako incidents resolve <id>` で手動解決

## Notes

- acknowledge は ongoing ステータスのインシデントに対してのみ有効。それ以外 (acknowledged, resolved) ではエラーになる
- resolve は ongoing または acknowledged のインシデントに対して有効
- acknowledge はインシデントを解決するものではない。復旧はモニターが自動検出するか、`resolve` で手動解決する
- インシデント ID がわからない場合は先に `manako incidents list --status ongoing` で確認
- resolve の `--cause` オプションで解決時のメモを残せる(任意)
