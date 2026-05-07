---
name: admin-review
description: This skill should be used when the user asks to review service health or growth, such as "サービスの成長を確認したい", "週次レビューをやって", "月次レビュー", "問い合わせを確認して", "DAU/MAU を見たい", "プラン分布を確認", "check service growth", or "weekly admin review". Runs a structured admin check of Manako using CLI commands for growth metrics, activity, and open inquiries.
---

# Admin Review

Manakoサービスの定期健全性レビューを実施する。成長指標・アクティビティ・未対応問い合わせを一連のadmin CLIコマンドで確認し、要注意点を要約する。

## 前提条件

プロジェクトルートの `.env` に以下が必要 (CLIが自動でロードする):

```
MANAKO_ADMIN_API_KEY=<admin_api_key>
```

実行前に確認:
```bash
grep MANAKO_ADMIN_API_KEY .env
```

未設定の場合は作業を中断してユーザーに設定を依頼する。

## レビュー手順

以下の順で全コマンドを実行し、結果を収集してから総合評価する。
**月次レビュー時は `--period 90d`、週次は `--period 30d` を使用する。**

### 1. システム全体サマリー

```bash
manako admin stats
```

確認項目: `totalTeams`, `totalUsers`, `totalMonitors`, `activeMonitors`, `suspendedTeams`, `suspendedUsers`

### 2. 成長指標

```bash
manako admin analytics growth --period 30d
```

確認項目: 日別チーム/ユーザー登録数のトレンド (`registrations.teams`, `registrations.users`)、プラン分布 (`planDistribution`)、削除リクエスト数 (`churn.deletionRequests`)

### 3. アクティビティ指標

```bash
manako admin analytics activity --period 30d
```

確認項目: `dau`, `wau`, `mau`、`activeTeams.daily` の推移、`topActions`

### 4. 機能利用状況

```bash
manako admin analytics features
```

確認項目: `monitorsByType` (タイプ別モニター数)、`channelsByType` (通知チャンネル別)

### 5. 削除リクエスト確認

```bash
manako admin deletion-requests
```

確認項目: 件数、`daysRemaining` (猶予残り日数)。`daysRemaining` が7日以下のユーザーは特に要注意。

### 6. 未対応問い合わせ確認

```bash
manako admin inquiries --status open
```

オープンがなければ `in_progress` も確認:
```bash
manako admin inquiries --status in_progress
```

確認項目: 件数、`category`、`messagePreview` (問い合わせ内容の先頭120文字)

### 7. 進行中インシデント確認 (前回確認後に障害通知を受けた場合のみ実行)

```bash
manako admin incidents --status ongoing
```

## 分析・要約のフォーマット

全データ収集後、以下の構造で要約する。閾値の判断基準は `references/analysis-guide.md` を参照する:

```
## Manakoサービス定期レビュー (YYYY-MM-DD)

### 規模
- チーム数: X (うちサスペンド: Y)
- ユーザー数: X
- モニター数: X (アクティブ: Y)

### 成長 (直近30日)
- 新規チーム: X件
- 新規ユーザー: X件
- プラン分布: free X% / pro Y% / business Z%
- 削除リクエスト: X件

### アクティビティ
- DAU: X / WAU: Y / MAU: Z
- エンゲージメント率 (DAU/MAU): X%
- アクティブチーム: X件/日 (平均)

### 削除リクエスト
- 保留中: X件
  - (件数が1以上の場合) 最短 daysRemaining と件数を記載
- 7日以内に削除予定: X件

### 問い合わせ
- オープン: X件
  - (件数が1以上の場合) カテゴリ別内訳と内容概要を列挙
- 要対応: あり/なし

### 注目点
- [要注意項目があれば箇条書きで記載]
- [特になければ「特記事項なし」]
```

## 注意点

- `name` / `email` フィールドは CLI 側でマスク済み (`N***` / `n***@domain.com`)。そのまま表示してよい
- `messagePreview` はユーザーが書いた文章の先頭120文字。個人情報が含まれる可能性があるため、そのまま引用せず内容を要約して報告する
- インシデントが `ongoing` の場合は必ず要注意として報告する

## 詳細分析

より深い分析が必要な場合は `references/analysis-guide.md` を参照する。閾値の目安、期間別レビューの使い分け、追加調査コマンドが記載されている。
