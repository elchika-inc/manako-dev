# Monitor Types Reference

Manako がサポートする全 3 種類のモニタータイプの config 詳細。

## HTTP

Web サイトや API エンドポイントの HTTP リクエストによる死活監視。

**Config fields:**

| フィールド         | 型      | 必須 | デフォルト | 説明                                                    |
| ------------------ | ------- | ---- | ---------- | ------------------------------------------------------- |
| `url`              | string  | Yes  | -          | 監視対象 URL (public HTTP/HTTPS のみ)                   |
| `method`           | string  | No   | `GET`      | HTTP メソッド (GET, HEAD, POST のみ)                    |
| `expectedStatus`   | number  | No   | `200`      | 期待するステータスコード (100-599)                      |
| `timeoutMs`        | number  | No   | `10000`    | タイムアウト (ms, 1000-30000)                           |
| `headers`          | object  | No   | -          | カスタムリクエストヘッダ (host, authorization 等は不可) |
| `keyword`          | string  | No   | -          | レスポンスに含まれるべきキーワード                      |
| `keywordMustExist` | boolean | No   | -          | keyword が存在すべきか (true: 含む, false: 含まない)    |

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

| フィールド  | 型     | 必須 | デフォルト | 説明                          |
| ----------- | ------ | ---- | ---------- | ----------------------------- |
| `hostname`  | string | Yes  | -          | ホスト名                      |
| `port`      | number | Yes  | -          | ポート番号 (1-65535)          |
| `timeoutMs` | number | No   | `10000`    | タイムアウト (ms, 1000-30000) |

**CLI example:**

```bash
manako monitors add db.example.com --name "PostgreSQL" --type tcp \
  --config '{"hostname":"db.example.com","port":5432,"timeoutMs":10000}'
```

## Ping

ICMP Ping でホストの応答を確認。

**Config fields:**

| フィールド  | 型     | 必須 | デフォルト | 説明                                  |
| ----------- | ------ | ---- | ---------- | ------------------------------------- |
| `hostname`  | string | Yes  | -          | ホスト名                              |
| `timeoutMs` | number | No   | `10000`    | タイムアウト (ms, 1000-30000)         |
| `port`      | number | No   | `443`      | ポート番号 (TCP ping の場合, 1-65535) |

**CLI example:**

```bash
manako monitors add server.example.com --name "Server Ping" --type ping
```
