# Monitor Types Reference

Manako がサポートする全 7 種類のモニタータイプの config 詳細。

## HTTP

Web サイトや API エンドポイントの HTTP リクエストによる死活監視。

**Config fields:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `url` | string | Yes | - | 監視対象 URL (public HTTP/HTTPS のみ) |
| `method` | string | No | `GET` | HTTP メソッド (GET, HEAD, POST のみ) |
| `expectedStatus` | number | No | `200` | 期待するステータスコード (100-599) |
| `timeoutMs` | number | No | `10000` | タイムアウト (ms, 1000-30000) |
| `headers` | object | No | - | カスタムリクエストヘッダ (host, authorization 等は不可) |
| `keyword` | string | No | - | レスポンスに含まれるべきキーワード |
| `keywordMustExist` | boolean | No | - | keyword が存在すべきか (true: 含む, false: 含まない) |

**CLI example:**
```bash
manako monitors add https://api.example.com/health --name "API" --type http
```

**Config JSON example:**
```json
{
  "url": "https://api.example.com/health",
  "method": "GET",
  "expectedStatus": 200,
  "timeoutMs": 10000,
  "keyword": "ok"
}
```

## TCP

TCP ポートへの接続可否を確認。SSH、DB、メールサーバー等の監視に。

**Config fields:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `hostname` | string | Yes | - | ホスト名 |
| `port` | number | Yes | - | ポート番号 (1-65535) |
| `timeoutMs` | number | No | `10000` | タイムアウト (ms, 1000-30000) |

**CLI example:**
```bash
manako monitors add db.example.com --name "PostgreSQL" --type tcp \
  --config '{"hostname":"db.example.com","port":5432,"timeoutMs":10000}'
```

## Ping

ICMP Ping でホストの応答を確認。

**Config fields:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `hostname` | string | Yes | - | ホスト名 |
| `timeoutMs` | number | No | `10000` | タイムアウト (ms, 1000-30000) |
| `port` | number | No | `443` | ポート番号 (TCP ping の場合, 1-65535) |

**CLI example:**
```bash
manako monitors add server.example.com --name "Server Ping" --type ping
```

## Heartbeat

cron ジョブやバッチ処理からの定期 ping を受信し、途切れたら検知。

**Config fields:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `graceSeconds` | number | No | `300` | 猶予時間 (秒, 60-86400)。この時間内に ping がなければ down |

**CLI example:**
```bash
manako monitors add heartbeat --name "Nightly Backup" --type heartbeat \
  --config '{"graceSeconds":600}'
```

**使い方:** モニター作成後、表示される Heartbeat URL に定期的に HTTP リクエストを送信する。

## WebChange

Web ページの変更を検知。価格変更、コンテンツ更新の監視に。

**Config fields:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `url` | string | Yes | - | 監視対象 URL |
| `selector` | string | Conditional | - | CSS セレクタ。checkType が `text` または `both` の場合は必須 (CLI 省略時は `body` が使用される) |
| `checkType` | string | Yes | - | チェック種別: `text` (コンテンツハッシュ), `screenshot` (スクリーンショット比較), `both` (両方) |
| `changeMode` | string | No | `"tamper"` | 変更検知モード: `"tamper"` または `"track"` (下記参照) |

**changeMode options:**

- `changeMode` (optional): `"tamper"` (default) or `"track"`. Tamper mode keeps status "down" until baseline is manually reset. Track mode records changes while keeping status "up".

**checkType options:**

| 値 | 説明 | プラン制約 | 最小間隔 |
|-----|------|-----------|---------|
| `text` | CSS セレクタで指定した要素のテキスト内容のハッシュを比較 | Free / Paid | 300s |
| `screenshot` | ページのスクリーンショットを撮影し、画像ハッシュを比較 | Paid のみ | 1800s (30分) |
| `both` | text + screenshot の両方で検知 | Paid のみ | 1800s (30分) |

**CLI examples:**
```bash
# テキスト変更検知 (Free プラン可)
manako monitors add https://example.com/pricing --name "Price Watch" --type webchange \
  --config '{"url":"https://example.com/pricing","selector":".price","checkType":"text"}'

# スクリーンショット比較 (Paid プランのみ)
manako monitors add https://example.com --name "Visual Diff" --type webchange \
  --config '{"url":"https://example.com","checkType":"screenshot"}' --interval 1800

# 両方で検知 (Paid プランのみ)
manako monitors add https://example.com/pricing --name "Full Watch" --type webchange \
  --config '{"url":"https://example.com/pricing","selector":".price","checkType":"both"}' --interval 1800
```

## SSL

SSL/TLS 証明書の有効期限を監視。期限が近づいたらアラート。

**Config fields:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `hostname` | string | Yes | - | ホスト名 |
| `warnDays` | number[] | No | `[30, 14, 7, 1]` | 警告を出す残り日数の配列 |

**CLI example:**
```bash
manako monitors add example.com --name "SSL Check" --type ssl \
  --config '{"hostname":"example.com","warnDays":[30,14,7,1]}'
```

## Domain

ドメイン名の有効期限を監視。更新忘れを防止。

**Config fields:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `domain` | string | Yes | - | ドメイン名 |
| `warnDays` | number[] | No | `[30, 14, 7]` | 警告を出す残り日数の配列 |

**CLI example:**
```bash
manako monitors add example.com --name "Domain Expiry" --type domain \
  --config '{"domain":"example.com","warnDays":[30,14,7]}'
```
