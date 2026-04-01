---
name: manako-setup
description: This skill should be used when the user asks to "manako をセットアップ", "manako setup", "manako の設定", "manako CLI をインストール", "MCP Server を設定", "manako に接続", "manako plugin setup", "manako login", "monitoring tool setup". Guides initial setup of Manako CLI and MCP Server for Claude Code integration.
---

# Manako Setup

Manako CLI と MCP Server のセットアップをガイドし、Claude Code から監視操作を可能にする。

## Tool Priority

Manako との連携には 3 つの方法がある。優先順位に従い利用可能なツールを選択する:

1. **CLI** (推奨): `manako` コマンドを Bash で実行。最も簡潔で人間が読みやすい出力
2. **MCP**: `mcp__manako__*` ツールを直接呼び出し。Plugin の `.mcp.json` で自動設定
3. **API**: `curl` で REST API を直接呼び出し。最終手段

## Setup Flow

### Step 1: CLI の確認

Bash で `which manako` を実行して CLI の存在を確認する。

**CLI がインストール済みの場合:**

```bash
manako status
```

出力があれば認証済み。セットアップ完了。

**CLI が未インストールの場合:**

Manako モノレポ内で作業中なら:

```bash
pnpm --filter @manako/cli build
```

ビルド後、`pnpm --filter @manako/cli exec manako` で実行可能。

npm 公開版が利用可能になった場合:

```bash
npm install -g manako
```

### Step 2: CLI 認証

2 つの認証方法がある:

**Device Code Flow (推奨):**

```bash
manako login
```

ブラウザが自動で開き、表示されたコードを確認して承認する。承認完了後、API Key が自動的に `~/.manako.json` に保存される。

1. `manako login` を実行するとデバイスコードが発行される
2. ブラウザで `https://manako.dev/device` が開く
3. 画面に表示された 8 桁のコード (例: ABCD-EFGH) を確認する
4. ブラウザで承認すると CLI が自動的に認証完了する

**API Key 直接入力:**

```bash
manako login --api-key mk_your_api_key_here
```

API Key は Manako ダッシュボード (Settings > API Keys) で手動発行する。

### Step 3: MCP Server (オプション)

CLI が使えない環境では MCP Server を利用する。この Plugin の `.mcp.json` により自動設定される。

MCP ツールが利用可能か確認するには、ツール一覧に `mcp__manako__monitors` が存在するか確認する。

**MCP Device Code Flow 認証:**

MCP ツールが利用可能な場合、`mcp__manako__auth` ツールで認証を開始する:

```
mcp__manako__auth(action: "start")
```

ブラウザで承認 URL が表示される。ユーザーが承認後、`auth_status` ツールで状態を確認:

```
mcp__manako__auth(action: "status")
```

承認完了後は API Key が自動保存される。

**MCP API Key 認証:**

環境変数 `MANAKO_API_KEY` を設定する方法もある。`.mcp.json` で:

```json
{
  "mcpServers": {
    "manako": {
      "type": "http",
      "url": "https://mcp.manako.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${MANAKO_API_KEY}"
      }
    }
  }
}
```

### Step 4: 動作確認

セットアップ完了後、モニター一覧を取得して動作確認:

CLI: `manako status`
MCP: `mcp__manako__monitors(action: "list")`
API: `curl -H "Authorization: Bearer $MANAKO_API_KEY" https://api.manako.dev/api/v1/monitors`

## Logout

認証情報をクリアするには:

```bash
manako logout
```

`~/.manako.json` から認証情報が削除される。

## Troubleshooting

| 問題 | 対処 |
|------|------|
| `manako: command not found` | CLI 未インストール。Step 1 参照 |
| `Not logged in` | `manako login` で認証。Step 2 参照 |
| MCP ツールが見えない | Claude Code を再起動して `.mcp.json` を再読み込み |
| `401 Unauthorized` | API Key が無効。ダッシュボードで再発行 |
| `API key must start with mk_` | `mk_` プレフィックス付きの正しいキーを使用 |
