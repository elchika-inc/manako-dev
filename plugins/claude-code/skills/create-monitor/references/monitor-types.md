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
| `selector` | string | Yes | - | CSS セレクタ (CLI 省略時は `body` が使用される) |
| `checkType` | string | Yes | - | チェック種別 (`text` のみ) |

**CLI example:**
```bash
manako monitors add https://example.com/pricing --name "Price Watch" --type webchange \
  --config '{"url":"https://example.com/pricing","selector":".price","checkType":"text"}'
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
