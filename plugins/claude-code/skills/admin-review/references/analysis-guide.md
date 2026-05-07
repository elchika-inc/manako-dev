# Admin Review 詳細分析ガイド

## 各指標の解釈

### 成長トレンド評価

`analytics growth` の `registrations.teams` / `registrations.users` は日別配列。

**傾向の読み方:**
- 直近7日の合計 vs その前7日の合計を比較して増減率を算出
- 週末(土日)は登録数が下がる傾向があるため、週単位で比較する
- 削除リクエスト (`churn.deletionRequests`) が新規登録の10%超なら要注意

**プラン分布の健全性:**
| 状態 | 目安 |
|---|---|
| 理想 | free 60-70% / pro 20-30% / business 5-10% |
| 要改善 | free 90%以上 (収益化が課題) |
| 好調 | pro + business 合計30%以上 |

### DAU/WAU/MAU エンゲージメント評価

| 指標 | 計算式 | 目安 |
|---|---|---|
| DAU/MAU (粘着性) | DAU ÷ MAU × 100 | 15%以上が健全、10%未満は要注意 |
| WAU/MAU (週次エンゲージメント) | WAU ÷ MAU × 100 | 30%以上が健全 |

**注意:** DAU/WAU/MAU は `lastLoginAt` ベース。アクティブチームは監査ログの `teamId` ベース。
両方を合わせて見ることで実態がわかる。

### 機能利用状況の読み方

`analytics features` のモニタータイプ別データで使われていないタイプを確認:
- `http` が最多なのは正常
- `heartbeat`, `webchange` の利用率が低い → ランディングページやドキュメントで訴求余地あり
- 通知チャンネルは `email` / `slack` が多いのが一般的

### 削除リクエストの解釈

`deletion-requests` は猶予期間中 (通常30日) のアカウント削除保留リストを返す。

**`daysRemaining` による優先度分類:**

| 残り日数 | 対応方針 |
|---|---|
| 7日以下 | 要注意 — 意図しないデータ消失リスクがある場合は早急に確認 |
| 8〜14日 | 中優先 — 翌週レビュー時に再確認 |
| 15日以上 | 通常追跡 |

**`analytics growth` の `churn.deletionRequests` との使い分け:**
- `analytics growth` の `churn.deletionRequests` は期間内の**新規削除リクエスト申請数** (申請ベース)
- `deletion-requests` は現在**保留中**の件数 (実行待ちベース)
- 両方を合わせて見ることで「申請は多いが取り消しも多い」「積み上がっている」などのパターンが分かる

**通常の状態 vs 要注意:**
- 0件: 正常
- 1〜5件: 通常範囲 — daysRemaining を確認
- 6件以上: 増加傾向の可能性 — `analytics growth --period 30d` の churn データと照合

### 問い合わせカテゴリの解釈

`inquiries` の `category` フィールドの一般的な値と対応:

| カテゴリ | 優先度 | 対応方針 |
|---|---|---|
| bug | 高 | 開発チームへ即時エスカレーション |
| billing | 高 | 課金問題は迅速対応が必要 |
| feature_request | 中 | フィードバックとして記録 |
| general | 低 | 通常サポート対応 |
| other | 低 | 内容を確認して振り分け |

### サスペンドアカウントの評価

`stats` の `suspendedTeams` / `suspendedUsers` が多い場合:
- 0〜2件: 正常範囲
- 3件以上: 理由を確認 (spam, 規約違反, 未払い等)

## 期間別レビューの使い分け

| レビュー種別 | 推奨コマンド | 目的 |
|---|---|---|
| 日次チェック | `stats` + `inquiries --status open` | 問い合わせ対応と異常検知 |
| 週次レビュー | `analytics growth --period 30d` + `analytics activity` | 成長トレンド確認 |
| 月次レビュー | `analytics growth --period 90d` + `analytics features` + `reports uptime` | 全体健全性評価 |
| 四半期レビュー | 全コマンド + `--period 1y` | 中長期トレンド分析 |

## パフォーマンス確認 (障害懸念時)

通常レビューでは不要だが、障害や異常を感じた場合:

```bash
manako admin performance system --period 24h
manako admin performance workers --period 24h
manako admin reports uptime
manako admin reports response-times
```

**uptime レポートの読み方:**
- `averageUptimePercent` 99.5%以上: 優秀
- 99.0〜99.5%: 許容範囲
- 99.0%未満: 要調査

## 追加調査コマンド

特定チームやユーザーを深掘りしたい場合:

```bash
# チーム一覧をプラン別に見る
manako admin teams

# ユーザー一覧 (特定メールドメインで検索)
manako admin users --query "@gmail.com"

# 特定期間のインシデント
manako admin incidents --status resolved
```
