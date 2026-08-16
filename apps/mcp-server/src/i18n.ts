export type Language = "ja" | "en";

export interface Translation {
  server: {
    description: string;
  };
  auth: {
    description: string;
    authStatusDescription: string;
    authStatusDeviceCodeDesc: string;
    missingApiKey: string;
    invalidJson: string;
    deviceCodeFailed: string;
    deviceCodeMessage: string;
    authStatusPending: string;
    authStatusApproved: string;
    authStatusExpired: string;
    authStatusError: string;
    noSession: string;
    notAuthenticated: string;
    parseError: string;
    invalidRequest: string;
    missingToolName: string;
    unknownTool: string;
    methodNotFound: string;
  };
  monitors: {
    description: string;
    noMonitors: string;
    title: string;
    idRequired: string;
    nameRequired: string;
    urlOrConfigRequired: string;
    configRequired: string;
    created: string;
    updated: string;
    deleted: string;
    checkResult: string;
    unknownAction: string;
    upgradePlan: string;
    idRequiredForUpdate: string;
    maintenanceStarted: string;
    maintenanceEnded: string;
    maintenanceStartedAll: string;
    maintenanceStartedBulk: string;
    maintenanceEndedAll: string;
    maintenanceEndedBulk: string;
    statsReset: string;
  };
  incidents: {
    description: string;
    noIncidents: string;
    noIncidentsWithStatus: string;
    title: string;
    idRequiredForAck: string;
    acknowledged: string;
    titleRequired: string;
    created: string;
    titleOrCauseRequired: string;
    updated: string;
    resolved: string;
    deleted: string;
    unknownAction: string;
    idRequired: string;
    upgradePlan: string;
  };
  services: {
    description: string;
    noServices: string;
    title: string;
    unknownAction: string;
    upgradePlan: string;
    nameRequired: string;
    slugRequired: string;
    idRequired: string;
    nothingToUpdate: string;
    created: string;
    updated: string;
    deleted: string;
    statsReset: string;
  };
  auditLogs: {
    description: string;
    noLogs: string;
    title: string;
    unknownAction: string;
    upgradePlan: string;
  };
  notificationChannels: {
    description: string;
    testSent: string;
    idRequired: string;
    upgradePlan: string;
    unknownAction: string;
  };
}

const en: Translation = {
  server: {
    description: "Manako MCP Server - AI-native monitoring",
  },
  auth: {
    description:
      "Start Device Code Flow authentication. Returns a URL and code for the user to approve in their browser. After approval, call auth_status with the deviceCode to complete authentication.",
    authStatusDescription:
      "Check if the user has approved the Device Code Flow request. If approved, stores the API key in the session. Call this after auth tool returns a deviceCode.",
    authStatusDeviceCodeDesc: "The device code returned by the auth tool",
    missingApiKey: "Missing or invalid API key",
    invalidJson: "Invalid JSON in request body",
    deviceCodeFailed: "Failed to start device code flow ({{status}})",
    deviceCodeMessage:
      "Please open the following URL in your browser to authenticate:\n{{url}}\n\nYour user code: {{code}}\n\nAfter approving, call auth_status with deviceCode: {{deviceCode}}",
    authStatusPending:
      "Authorization pending. Please approve the request in your browser, then try again.",
    authStatusApproved: "Authentication successful. You can now use other tools.",
    authStatusExpired: "Device code has expired. Please call auth again to restart.",
    authStatusError: "Authentication error: {{message}}",
    noSession: "No session. Call initialize first.",
    notAuthenticated:
      "Not authenticated. Use the auth tool to login, or provide an API key via Authorization header.",
    parseError: "Parse error",
    invalidRequest: "Invalid Request",
    missingToolName: "Missing tool name",
    unknownTool: "Unknown tool: {{name}}",
    methodNotFound: "Method not found: {{method}}",
  },
  monitors: {
    description:
      "Manage monitoring targets. Actions: list (show all), get (detail by ID), create (new monitor, supports all types), update (modify by ID), delete (remove by ID), stats-reset (delete check history). Use verbose=true for full data.",
    noMonitors: "No monitors configured.",
    title: "Monitors ({{count}}):",
    idRequired: "id is required for {{action}} action",
    nameRequired: "name is required for create action",
    urlOrConfigRequired: "url or config is required for http create",
    configRequired: "config is required for non-http types",
    created: "Created: {{summary}}\nID: {{id}}",
    updated: "Updated: {{summary}}\nID: {{id}}",
    deleted: "Monitor {{id}} deleted.",
    checkResult: "Check result: {{status}}",
    unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    idRequiredForUpdate: "id is required for update action",
    maintenanceStarted: "Maintenance started: {{name}} ({{id}}) - until {{until}}",
    maintenanceEnded: "Maintenance ended: {{name}} ({{id}})",
    maintenanceStartedAll: "Maintenance started for {{count}} monitors until {{until}}",
    maintenanceStartedBulk: "Maintenance started for {{count}} monitors until {{until}}",
    maintenanceEndedAll: "Maintenance ended for {{count}} monitors",
    maintenanceEndedBulk: "Maintenance ended for {{count}} monitors",
    statsReset: "Stats reset: {{count}} records deleted",
  },
  incidents: {
    description:
      "Manage incidents. Actions: list, acknowledge, create (manual), update, resolve, delete (manual only). Use verbose=true for full data.",
    noIncidents: "No incidents.",
    noIncidentsWithStatus: "No {{status}} incidents.",
    title: "Incidents ({{count}}):",
    idRequiredForAck: "id is required for acknowledge action",
    acknowledged: "Incident {{id}} acknowledged.",
    titleRequired: "title is required for create action",
    created: "Created: {{summary}}\nID: {{id}}",
    titleOrCauseRequired: "title or cause is required for update action",
    updated: "Updated: {{summary}}",
    resolved: "Resolved: {{summary}}",
    deleted: "Incident {{id}} deleted.",
    unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
    idRequired: "id is required for {{action}} action",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
  },
  services: {
    description:
      "Manage services (monitor groups). Actions: list (show all services), create (new service; slug derived from name if omitted), update (rename/re-slug/toggle public by ID), delete (remove by ID; its monitors move to the default service), stats-reset (delete check history by service ID). Use verbose=true for full data.",
    noServices: "No services configured.",
    title: "Services ({{count}}):",
    unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    nameRequired: "Service name is required for create.",
    slugRequired:
      "Could not derive a slug from the name. Provide slug explicitly (lowercase alphanumeric with hyphens, min 2 chars).",
    idRequired: "Service ID is required for {{action}}.",
    nothingToUpdate:
      "Nothing to update. Provide at least one of: name, slug, description, isPublic.",
    created: "Service created: {{name}} (ID: {{id}}, slug: {{slug}})",
    updated: "Service updated: {{name}} (ID: {{id}})",
    deleted: "Service {{id}} deleted. Its monitors were moved to the default service.",
    statsReset: "Stats reset: {{count}} records deleted",
  },
  auditLogs: {
    description:
      "View audit logs. Actions: list (show audit trail with optional filters). Use verbose=true for full data.",
    noLogs: "No audit logs found.",
    title: "Audit Logs ({{count}} entries):",
    unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
  },
  notificationChannels: {
    description:
      "Test notification channels. Actions: test (send a test notification to verify channel config). Requires channel ID.",
    testSent: "Test notification sent to channel {{id}}.",
    idRequired: "id is required for test action",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    unknownAction: "Unknown action: {{action}}. Use: test",
  },
};

const ja: Translation = {
  server: {
    description: "Manako MCP Server - AI対応モニタリング",
  },
  auth: {
    description:
      "デバイスコードフロー認証を開始します。ブラウザで承認するためのURLとコードを返します。承認後、deviceCodeを使ってauth_statusを呼び出して認証を完了してください。",
    authStatusDescription:
      "デバイスコードフローのリクエストが承認されたか確認します。承認済みの場合、APIキーをセッションに保存します。authツールがdeviceCodeを返した後に呼び出してください。",
    authStatusDeviceCodeDesc: "authツールが返したデバイスコード",
    missingApiKey: "APIキーが無効または未設定です",
    invalidJson: "リクエストボディのJSONが不正です",
    deviceCodeFailed: "デバイスコードフローの開始に失敗しました ({{status}})",
    deviceCodeMessage:
      "以下のURLをブラウザで開いて認証してください:\n{{url}}\n\nユーザーコード: {{code}}\n\n承認後、deviceCode: {{deviceCode}} を使ってauth_statusを呼び出してください",
    authStatusPending: "承認待ちです。ブラウザでリクエストを承認してから再試行してください。",
    authStatusApproved: "認証に成功しました。他のツールを使用できます。",
    authStatusExpired: "デバイスコードの有効期限が切れました。再度authを呼び出してください。",
    authStatusError: "認証エラー: {{message}}",
    noSession: "セッションがありません。先に initialize を呼び出してください。",
    notAuthenticated:
      "認証されていません。auth ツールでログインするか、Authorization ヘッダーでAPIキーを指定してください。",
    parseError: "パースエラー",
    invalidRequest: "不正なリクエスト",
    missingToolName: "ツール名が指定されていません",
    unknownTool: "不明なツール: {{name}}",
    methodNotFound: "メソッドが見つかりません: {{method}}",
  },
  monitors: {
    description:
      "監視ターゲットを管理します。アクション: list (一覧), get (詳細), create (作成), update (更新), delete (削除), check (即時チェック), stats-reset (統計リセット)。verbose=true で全データ表示。",
    noMonitors: "モニターが設定されていません。",
    title: "モニター ({{count}}):",
    idRequired: "{{action}} アクションには id が必要です",
    nameRequired: "作成アクションには name が必要です",
    urlOrConfigRequired: "HTTP作成には url または config が必要です",
    configRequired: "HTTP以外のタイプには config が必要です",
    created: "作成: {{summary}}\nID: {{id}}",
    updated: "更新: {{summary}}\nID: {{id}}",
    deleted: "モニター {{id}} を削除しました。",
    checkResult: "チェック結果: {{status}}",
    unknownAction: "不明なアクション: {{action}}。使用可能: {{actions}}",
    upgradePlan: "{{msg}}\nプランをアップグレード: {{url}}",
    idRequiredForUpdate: "更新アクションには id が必要です",
    maintenanceStarted: "メンテナンス開始: {{name}} ({{id}}) - {{until}} まで",
    maintenanceEnded: "メンテナンス終了: {{name}} ({{id}})",
    maintenanceStartedAll: "{{count}}件のモニターのメンテナンスを開始しました (終了: {{until}})",
    maintenanceStartedBulk: "{{count}}件のモニターのメンテナンスを開始しました (終了: {{until}})",
    maintenanceEndedAll: "{{count}}件のモニターのメンテナンスを終了しました",
    maintenanceEndedBulk: "{{count}}件のモニターのメンテナンスを終了しました",
    statsReset: "統計リセット: {{count}} 件のレコードを削除しました",
  },
  incidents: {
    description:
      "インシデントを管理します。アクション: list (一覧), acknowledge (確認), create (手動作成), update (更新), resolve (解決), delete (手動のみ削除)。verbose=true で全データ表示。",
    noIncidents: "インシデントはありません。",
    noIncidentsWithStatus: "{{status}} のインシデントはありません。",
    title: "インシデント ({{count}}):",
    idRequiredForAck: "acknowledge アクションには id が必要です",
    acknowledged: "インシデント {{id}} を確認済みにしました。",
    titleRequired: "作成アクションには title が必要です",
    created: "作成: {{summary}}\nID: {{id}}",
    titleOrCauseRequired: "更新アクションには title または cause が必要です",
    updated: "更新: {{summary}}",
    resolved: "解決: {{summary}}",
    deleted: "インシデント {{id}} を削除しました。",
    unknownAction: "不明なアクション: {{action}}。使用可能: {{actions}}",
    idRequired: "{{action}} アクションには id が必要です",
    upgradePlan: "{{msg}}\nプランをアップグレード: {{url}}",
  },
  services: {
    description:
      "サービス (モニターのグループ) を管理します。アクション: list (全サービス一覧), create (新規作成。slug 省略時は name から自動生成), update (ID 指定で名前/slug/公開設定を変更), delete (ID 指定で削除。モニターはデフォルトサービスへ移動), stats-reset (統計リセット)。verbose=true で全データ表示。",
    noServices: "サービスが設定されていません。",
    title: "サービス ({{count}}):",
    unknownAction: "不明なアクション: {{action}}。使用可能: {{actions}}",
    upgradePlan: "{{msg}}\nプランをアップグレード: {{url}}",
    nameRequired: "create には name が必要です。",
    slugRequired:
      "name から slug を生成できませんでした。slug を明示指定してください (小文字英数字とハイフン、2文字以上)。",
    idRequired: "{{action}} にはサービス ID が必要です。",
    nothingToUpdate:
      "更新する項目がありません。name / slug / description / isPublic のいずれかを指定してください。",
    created: "サービスを作成しました: {{name}} (ID: {{id}}, slug: {{slug}})",
    updated: "サービスを更新しました: {{name}} (ID: {{id}})",
    deleted: "サービス {{id}} を削除しました。モニターはデフォルトサービスへ移動しました。",
    statsReset: "統計リセット: {{count}} 件のレコードを削除しました",
  },
  auditLogs: {
    description:
      "監査ログを表示します。アクション: list (フィルター付き監査証跡を表示)。verbose=true で全データ表示。",
    noLogs: "監査ログが見つかりません。",
    title: "監査ログ ({{count}} 件):",
    unknownAction: "不明なアクション: {{action}}。使用可能: {{actions}}",
    upgradePlan: "{{msg}}\nプランをアップグレード: {{url}}",
  },
  notificationChannels: {
    description:
      "通知チャンネルをテストします。アクション: test (テスト通知を送信して設定を確認)。チャンネルIDが必要です。",
    testSent: "チャンネル {{id}} にテスト通知を送信しました。",
    idRequired: "test アクションには id が必要です",
    upgradePlan: "{{msg}}\nプランをアップグレード: {{url}}",
    unknownAction: "不明なアクション: {{action}}。使用可能: test",
  },
};

const translations: Record<Language, Translation> = { en, ja };

export function getTranslation(lang: Language): Translation {
  return translations[lang];
}

export function detectLanguage(acceptLanguage: string): Language {
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

/**
 * Simple template interpolation: replaces `{{key}}` with values from `vars`.
 */
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}
