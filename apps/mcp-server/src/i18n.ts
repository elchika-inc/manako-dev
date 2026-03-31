export type Language = "ja" | "en";

export interface Translation {
  server: {
    description: string;
  };
  auth: {
    description: string;
    emailDesc: string;
    passwordDesc: string;
    missingApiKey: string;
    invalidJson: string;
    emailPasswordRequired: string;
    loginFailed: string;
    keyCreationFailed: string;
    authenticated: string;
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
    baselineReset: string;
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
  statusPages: {
    description: string;
    noPages: string;
    title: string;
    unknownAction: string;
    upgradePlan: string;
    customDomainHint: string;
  };
  auditLogs: {
    description: string;
    noLogs: string;
    title: string;
    unknownAction: string;
    upgradePlan: string;
  };
}

const en: Translation = {
  server: {
    description: "Manako MCP Server - AI-native monitoring",
  },
  auth: {
    description:
      "Login to Manako with email and password. Creates an API key for this session. Must be called before using other tools if no API key is provided via Authorization header.",
    emailDesc: "Account email address",
    passwordDesc: "Account password",
    missingApiKey: "Missing or invalid API key",
    invalidJson: "Invalid JSON in request body",
    emailPasswordRequired: "email and password are required",
    loginFailed: "Login failed ({{status}})",
    keyCreationFailed: "API key creation failed ({{status}})",
    authenticated:
      "Authenticated as {{email}}. Session active for 24 hours.",
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
    unknownAction:
      "Unknown action: {{action}}. Use: {{actions}}",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    idRequiredForUpdate: "id is required for update action",
    maintenanceStarted: "Maintenance started: {{name}} ({{id}}) - until {{until}}",
    maintenanceEnded: "Maintenance ended: {{name}} ({{id}})",
    maintenanceStartedAll: "Maintenance started for {{count}} monitors until {{until}}",
    maintenanceStartedBulk: "Maintenance started for {{count}} monitors until {{until}}",
    maintenanceEndedAll: "Maintenance ended for {{count}} monitors",
    maintenanceEndedBulk: "Maintenance ended for {{count}} monitors",
    baselineReset: "Baseline reset: {{name}} ({{id}})",
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
    titleOrCauseRequired:
      "title or cause is required for update action",
    updated: "Updated: {{summary}}",
    resolved: "Resolved: {{summary}}",
    deleted: "Incident {{id}} deleted.",
    unknownAction:
      "Unknown action: {{action}}. Use: {{actions}}",
    idRequired: "id is required for {{action}} action",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
  },
  statusPages: {
    description:
      "View status pages and custom domain status. Actions: list (show all status pages with custom domain info), stats-reset (delete check history by status page ID). Use verbose=true for full data.",
    noPages: "No status pages configured.",
    title: "Status Pages ({{count}}):",
    unknownAction:
      "Unknown action: {{action}}. Use: {{actions}}",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    customDomainHint: "Custom domain can be configured from the dashboard.",
  },
  auditLogs: {
    description:
      "View audit logs. Actions: list (show audit trail with optional filters). Use verbose=true for full data.",
    noLogs: "No audit logs found.",
    title: "Audit Logs ({{count}} entries):",
    unknownAction:
      "Unknown action: {{action}}. Use: {{actions}}",
    upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
  },
};

const ja: Translation = {
  server: {
    description: "Manako MCP Server - AI対応モニタリング",
  },
  auth: {
    description:
      "メールアドレスとパスワードでManakoにログインします。このセッション用のAPIキーを作成します。Authorization ヘッダーでAPIキーが提供されていない場合、他のツールを使用する前に呼び出す必要があります。",
    emailDesc: "アカウントのメールアドレス",
    passwordDesc: "アカウントのパスワード",
    missingApiKey: "APIキーが無効または未設定です",
    invalidJson: "リクエストボディのJSONが不正です",
    emailPasswordRequired: "メールアドレスとパスワードは必須です",
    loginFailed: "ログインに失敗しました ({{status}})",
    keyCreationFailed: "APIキーの作成に失敗しました ({{status}})",
    authenticated:
      "{{email}} として認証されました。セッションは24時間有効です。",
    noSession:
      "セッションがありません。先に initialize を呼び出してください。",
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
    urlOrConfigRequired:
      "HTTP作成には url または config が必要です",
    configRequired: "HTTP以外のタイプには config が必要です",
    created: "作成: {{summary}}\nID: {{id}}",
    updated: "更新: {{summary}}\nID: {{id}}",
    deleted: "モニター {{id}} を削除しました。",
    checkResult: "チェック結果: {{status}}",
    unknownAction:
      "不明なアクション: {{action}}。使用可能: {{actions}}",
    upgradePlan:
      "{{msg}}\nプランをアップグレード: {{url}}",
    idRequiredForUpdate: "更新アクションには id が必要です",
    maintenanceStarted: "メンテナンス開始: {{name}} ({{id}}) - {{until}} まで",
    maintenanceEnded: "メンテナンス終了: {{name}} ({{id}})",
    maintenanceStartedAll: "{{count}}件のモニターのメンテナンスを開始しました (終了: {{until}})",
    maintenanceStartedBulk: "{{count}}件のモニターのメンテナンスを開始しました (終了: {{until}})",
    maintenanceEndedAll: "{{count}}件のモニターのメンテナンスを終了しました",
    maintenanceEndedBulk: "{{count}}件のモニターのメンテナンスを終了しました",
    baselineReset: "ベースラインリセット: {{name}} ({{id}})",
  },
  incidents: {
    description:
      "インシデントを管理します。アクション: list (一覧), acknowledge (確認), create (手動作成), update (更新), resolve (解決), delete (手動のみ削除)。verbose=true で全データ表示。",
    noIncidents: "インシデントはありません。",
    noIncidentsWithStatus:
      "{{status}} のインシデントはありません。",
    title: "インシデント ({{count}}):",
    idRequiredForAck:
      "acknowledge アクションには id が必要です",
    acknowledged:
      "インシデント {{id}} を確認済みにしました。",
    titleRequired: "作成アクションには title が必要です",
    created: "作成: {{summary}}\nID: {{id}}",
    titleOrCauseRequired:
      "更新アクションには title または cause が必要です",
    updated: "更新: {{summary}}",
    resolved: "解決: {{summary}}",
    deleted: "インシデント {{id}} を削除しました。",
    unknownAction:
      "不明なアクション: {{action}}。使用可能: {{actions}}",
    idRequired: "{{action}} アクションには id が必要です",
    upgradePlan:
      "{{msg}}\nプランをアップグレード: {{url}}",
  },
  statusPages: {
    description:
      "ステータスページとカスタムドメインの状態を表示します。アクション: list (全ステータスページとカスタムドメイン情報一覧), stats-reset (統計リセット)。verbose=true で全データ表示。",
    noPages: "ステータスページが設定されていません。",
    title: "ステータスページ ({{count}}):",
    unknownAction:
      "不明なアクション: {{action}}。使用可能: {{actions}}",
    upgradePlan:
      "{{msg}}\nプランをアップグレード: {{url}}",
    customDomainHint: "カスタムドメインはダッシュボードから設定できます。",
  },
  auditLogs: {
    description:
      "監査ログを表示します。アクション: list (フィルター付き監査証跡を表示)。verbose=true で全データ表示。",
    noLogs: "監査ログが見つかりません。",
    title: "監査ログ ({{count}} 件):",
    unknownAction:
      "不明なアクション: {{action}}。使用可能: {{actions}}",
    upgradePlan:
      "{{msg}}\nプランをアップグレード: {{url}}",
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
export function t(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => String(vars[key] ?? `{{${key}}}`),
  );
}
