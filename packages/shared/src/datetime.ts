/**
 * DB形式 "YYYY-MM-DD HH:MM:SS" → ISO 8601 "YYYY-MM-DDTHH:MM:SSZ"
 * 既にISO 8601形式(T区切り + Z付き)の場合はそのまま返す(二重変換防止)
 * 入力はUTC固定のDB値またはUTC ISO文字列を前提とする。
 */
export function toISOUTC(dbDatetime: string): string {
  if (dbDatetime.includes("T")) {
    // 既にISO形式の場合、小数秒を除去して統一(3桁ミリ秒〜6桁マイクロ秒に対応)
    // 注: 2つ目の replace はオフセット付きISO(例: "...+09:00")への防御。
    // DB値はUTC固定のため通常発生しないが、外部入力の安全弁として残す。
    return dbDatetime.replace(/\.\d+Z$/, "Z").replace(/\.\d+\+/, "+");
  }
  return dbDatetime.replace(" ", "T") + "Z";
}

/** nullableラッパー */
export function toISOUTCOrNull(dbDatetime: string | null): string | null {
  return dbDatetime ? toISOUTC(dbDatetime) : null;
}

/** ISO 8601 またはDate → DB形式 "YYYY-MM-DD HH:MM:SS" (UTC) */
export function toDBDatetime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toISOString().replace("T", " ").slice(0, 19);
}

/**
 * from/to フィルタパラメータ → DB比較用形式に変換
 * ISO 8601("2025-01-01T00:00:00Z")、日付のみ("2025-01-01")、DB形式いずれも受け付ける
 * 入力はUTC (`Z`) またはタイムゾーンなしの文字列を前提とする。
 */
export function toDBFilter(input: string): string {
  if (input.includes("T")) {
    return input.replace("T", " ").replace(/\.\d+/, "").replace(/Z$/, "");
  }
  // 日付のみの場合はそのまま(SQLite文字列比較で正しく動作)
  return input;
}
