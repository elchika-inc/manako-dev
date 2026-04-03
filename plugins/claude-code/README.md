# Manako Claude Code Plugin

Manako 監視ダッシュボードの Claude Code Plugin。モニター管理・インシデント対応を Claude Code から直接実行できます。

## インストール

Claude Code で以下のコマンドを実行します:

```
/plugin marketplace add elchika-inc/manako-dev
/plugin install manako@manako-dev
/reload-plugins
```

### 手動インストール

リポジトリをクローンして `.claude/settings.json` に直接追加する方法もあります:

```bash
git clone https://github.com/elchika-inc/manako-dev.git
```

```json
{
  "enabledPlugins": [
    "/path/to/manako-dev/claude-code-plugin"
  ]
}
```

## セットアップ

プラグインインストール後、Claude Code で以下を実行:

1. **CLI 認証** (推奨): `manako login --api-key mk_your_key`
2. **MCP 認証**: 自動設定済み。「Manako にログインして」と依頼

## 利用可能なスキル

| スキル | 呼び出し例 | 説明 |
|--------|-----------|------|
| **setup** | 「manako をセットアップして」 | CLI/MCP の初期設定ガイド |
| **monitor-status** | 「モニターの状態を確認して」 | モニター状態確認・即座チェック |
| **create-monitor** | 「example.com を監視して」 | モニター作成 (7 タイプ対応) |
| **list-incidents** | 「インシデント一覧を見せて」 | インシデント一覧・フィルタ |
| **acknowledge-incident** | 「インシデントを確認済みにして」 | インシデント確認済みマーク |

## ツール優先順位

スキルは以下の優先順位でツールを選択します:

1. **CLI** (`manako` コマンド) - ローカルインストール済みの場合
2. **MCP** (Manako MCP Server) - プラグイン同梱の `.mcp.json` で自動設定
3. **API** (`curl` 直接呼び出し) - フォールバック

## 対応モニタータイプ

| タイプ | 用途 |
|--------|------|
| HTTP | Web サイト/API の死活監視 |
| TCP | ポート接続確認 |
| Ping | Ping 応答確認 |
| Heartbeat | cron/バッチの生存確認 |
| WebChange | Web ページの変更検知 |
| SSL | SSL 証明書の期限監視 |
| Domain | ドメインの期限監視 |

## 要件

- Claude Code
- Manako アカウント + API Key (`mk_` プレフィックス)
- (オプション) Manako CLI インストール済み
