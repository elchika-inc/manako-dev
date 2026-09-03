import type { NotificationChannelType } from "./constants.js";

const ENC_PREFIX = "enc:";

export const SECRET_FIELDS: Record<NotificationChannelType, string[]> = {
  email: [],
  slack: ["webhookUrl"],
  discord: ["webhookUrl"],
  line: ["channelAccessToken"],
  webhook: ["url", "secret"],
  github: ["token"],
};

/**
 * 環境が提供する Web Crypto の鍵型。
 *
 * このモジュールは Workers (`@cloudflare/workers-types`) と Node
 * (`@types/node`) の両方の tsconfig の下でソースとして型検査される。
 * `CryptoKey` を名前で参照すると、`@types/node` では値としてしか
 * 宣言されていないため型位置で使えない (TS2749)。
 * 実際の API の戻り値から導出すれば、どちらの環境でも正しい型になる。
 */
type ChannelKey = Awaited<ReturnType<typeof crypto.subtle.deriveKey>>;

async function deriveChannelKey(keyMaterial: string): Promise<ChannelKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(keyMaterial), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("manako-channel-encryption"),
      info: encoder.encode("channel-config"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function uint8ToBase64(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

async function encryptValue(value: string, key: ChannelKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );
  const ivB64 = uint8ToBase64(iv);
  const ctB64 = uint8ToBase64(new Uint8Array(ciphertext));
  return `${ENC_PREFIX}${ivB64}:${ctB64}`;
}

async function decryptValue(encrypted: string, key: ChannelKey): Promise<string> {
  const withoutPrefix = encrypted.slice(ENC_PREFIX.length);
  const parts = withoutPrefix.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Invalid encrypted channel config format");
  }
  const iv = Uint8Array.from(atob(parts[0]), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

export async function encryptSecretFields(
  config: Record<string, unknown>,
  channelType: string,
  keyMaterial: string | undefined,
): Promise<Record<string, unknown>> {
  const fields = SECRET_FIELDS[channelType as NotificationChannelType];
  if (!fields || fields.length === 0 || !keyMaterial) {
    return config;
  }
  const key = await deriveChannelKey(keyMaterial);
  const result = { ...config };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && !isEncrypted(value)) {
      result[field] = await encryptValue(value, key);
    }
  }
  return result;
}

export async function decryptSecretFields(
  config: Record<string, unknown>,
  channelType: string,
  keyMaterial: string | undefined,
): Promise<Record<string, unknown>> {
  const fields = SECRET_FIELDS[channelType as NotificationChannelType];
  if (!fields || fields.length === 0 || !keyMaterial) {
    return config;
  }
  const key = await deriveChannelKey(keyMaterial);
  const result = { ...config };
  for (const field of fields) {
    const value = result[field];
    if (isEncrypted(value)) {
      result[field] = await decryptValue(value as string, key);
    }
  }
  return result;
}
