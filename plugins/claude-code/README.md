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
  "enabledPlugins": ["/path/to/manako-dev/claude-code-plugin"]
}
```

## セットアップ

プラグインインストール後、Claude Code で以下を実行:

1. **CLI 認証** (推奨): `manako login --api-key mk_your_key`
2. **MCP 認証**: 自動設定済み。「Manako にログインして」と依頼

## 利用可能なエージェント

| エージェント      | トリガー例                                                              | 説明                                                                             |
| ----------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **site-explorer** | 「https://... を触って問題を報告して」「URL1 と URL2 を両方テストして」 | 渡した URL（複数可）を探索的にテストし、バグ・UI崩れ・コンソールエラーを自動報告 |

## 利用可能なスキル

| スキル                    | 呼び出し例                       | 説明                                             |
| ------------------------- | -------------------------------- | ------------------------------------------------ |
| **setup**                 | 「manako をセットアップして」    | CLI/MCP の初期設定ガイド                         |
| **monitor-status**        | 「モニターの状態を確認して」     | モニター状態確認・即座チェック                   |
| **create-monitor**        | 「example.com を監視して」       | モニター作成 (3 タイプ対応)                      |
| **list-incidents**        | 「インシデント一覧を見せて」     | インシデント一覧・フィルタ                       |
| **acknowledge-incident**  | 「インシデントを確認済みにして」 | インシデント確認済みマーク                       |
| **notification-channels** | 「通知チャンネルを一覧して」     | 通知チャンネルの一覧・管理                       |
| **audit-logs**            | 「監査ログを見せて」             | 監査ログの取得・フィルタ                         |
| **maintenance**           | 「メンテナンス期間を設定して」   | メンテナンスウィンドウの作成・管理               |
| **admin-review**          | 「サービス全体の状況を分析して」 | 運営者向けの読み取り専用分析（本パッケージのみ） |

## ツール優先順位

スキルは以下の優先順位でツールを選択します:

1. **CLI** (`manako` コマンド) - ローカルインストール済みの場合
2. **MCP** (Manako MCP Server) - プラグイン同梱の `.mcp.json` で自動設定
3. **API** (`curl` 直接呼び出し) - フォールバック

## 対応モニタータイプ

| タイプ | 用途                      |
| ------ | ------------------------- |
| HTTP   | Web サイト/API の死活監視 |
| TCP    | ポート接続確認            |
| Ping   | Ping 応答確認             |

## 要件

- Claude Code
- Manako アカウント + API Key (`mk_` プレフィックス)
- (オプション) Manako CLI インストール済み
- **site-explorer エージェントを使う場合**: Playwright MCP サーバー（`@playwright/mcp`）をユーザー自身の Claude Code 設定に追加が必要
