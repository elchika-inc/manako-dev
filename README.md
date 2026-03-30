# Manako Dev

[English](./README.en.md)

[Manako](https://manako.dev) 開発者向けツール - MCP Server、Claude Code Plugin、API Client を提供します。

**[公式サイト](https://manako.dev)** | **[ドキュメント](https://docs.manako.dev)** | **[ダッシュボード](https://app.manako.dev)** | **[ステータス](https://status.manako.dev)**

## 概要

| コンポーネント | 説明 |
|--------------|------|
| **MCP Server** | AI エージェントがモニターやインシデントを管理するための Model Context Protocol サーバー |
| **Claude Code Plugin** | Claude Code マーケットプレイスから利用できるモニタリング操作プラグイン |
| **API Client** | Manako Public API の TypeScript クライアントライブラリ |

## Claude Code Plugin

### マーケットプレイスからインストール

```bash
/plugin marketplace add elchika-inc/manako-dev
/plugin install manako@manako-dev
```

### セットアップ

インストール後、Claude Code で以下を実行してください:

1. **CLI 認証(推奨):** `manako login --api-key mk_your_key`
2. **MCP 認証:** Claude に "Manako にログインして" と依頼

### 利用可能なスキル

| スキル | 使用例 | 説明 |
|-------|--------|------|
| **setup** | "manako をセットアップして" | CLI/MCP の初期セットアップガイド |
| **monitor-status** | "モニターの状態を確認して" | モニターの状態を確認 |
| **create-monitor** | "example.com を監視して" | モニターを作成(7種類対応) |
| **list-incidents** | "インシデント一覧を見せて" | インシデントの一覧表示・フィルタリング |
| **acknowledge-incident** | "インシデントを確認済みにして" | インシデントの確認(acknowledge) |
| **audit-logs** | "監査ログを確認して" | チームの監査ログを表示 |

## MCP Server

MCP Server は `https://mcp.manako.dev/mcp` でホストされており、Streamable HTTP トランスポート(MCP プロトコル `2024-11-05`)をサポートしています。

### 手動接続

MCP クライアントの設定に以下を追加してください:

```json
{
  "mcpServers": {
    "manako": {
      "type": "http",
      "url": "https://mcp.manako.dev/mcp",
      "headers": {
        "Authorization": "Bearer mk_your_api_key"
      }
    }
  }
}
```

### ツール一覧

- **monitors** - モニターの一覧取得、作成、更新、削除、チェック実行
- **incidents** - インシデントの一覧取得、確認、作成、更新、解決、削除
- **status-pages** - ステータスページの一覧取得
- **audit-logs** - 監査ログの一覧取得
- **auth** - メール/パスワードでログイン(セッション API キーを発行)

## API Client

```typescript
import { ManakoClient } from "@manako/api-client";

const client = new ManakoClient({
  apiUrl: "https://api.manako.dev",
  apiKey: "mk_your_api_key",
});

const { monitors } = await client.listMonitors();
```

## セルフホスティング

MCP Server は Cloudflare Workers にデプロイできます:

```bash
cd apps/mcp-server
pnpm install
pnpm deploy
```

## リンク

- [Manako 公式サイト](https://manako.dev) - プロダクトランディングページ
- [ドキュメント](https://docs.manako.dev) - ガイド、API リファレンス、セットアップ手順
- [API リファレンス](https://docs.manako.dev/api/) - Public API ドキュメント(OpenAPI)
- [ダッシュボード](https://app.manako.dev) - モニタリングダッシュボード
- [ステータスページ](https://status.manako.dev) - Manako サービスステータス

## コントリビュート

コントリビュートを歓迎します! このリポジトリに Pull Request を作成してください。

## ライセンス

MIT
