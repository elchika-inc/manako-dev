/**
 * SSRF Protection: Private/internal IP detection
 *
 * Detects private, loopback, link-local, and other non-routable IP addresses
 * to prevent Server-Side Request Forgery attacks.
 */

/**
 * Parse an IPv4 address string into a 32-bit unsigned integer.
 * Handles two-to-four-part inet_aton notation with decimal, octal (0-prefixed),
 * or hex (0x-prefixed) components, plus decimal and hex single-integer notation.
 *
 * @returns 32-bit unsigned integer or null if invalid
 */
function parseIPv4(ip: string): number | null {
  // Single integer or hex notation (e.g., "2130706433", "0x7f000001")
  if (/^(0x[\da-fA-F]+|\d+)$/.test(ip) && !ip.includes(".")) {
    const num = Number(ip);
    if (Number.isInteger(num) && num >= 0 && num <= 0xffffffff) {
      return num;
    }
    return null;
  }

  const parts = ip.split(".");
  if (parts.length < 2 || parts.length > 4) return null;

  let result = 0;
  for (const [index, part] of parts.entries()) {
    let val: number;
    if (part.startsWith("0x") || part.startsWith("0X")) {
      val = parseInt(part, 16);
    } else if (part.startsWith("0") && part.length > 1) {
      val = parseInt(part, 8);
    } else {
      val = parseInt(part, 10);
    }

    const isLastPart = index === parts.length - 1;
    const partBits = isLastPart ? 8 * (5 - parts.length) : 8;
    const maxPartValue = 2 ** partBits - 1;
    if (!Number.isInteger(val) || val < 0 || val > maxPartValue) return null;

    result = result * 2 ** partBits + val;
  }
  return result >>> 0;
}

/**
 * Check if an IPv4 address (as 32-bit integer) falls within private/reserved ranges.
 *
 * Covered ranges:
 * - 0.0.0.0/8       (this network)
 * - 10.0.0.0/8      (private)
 * - 100.64.0.0/10   (RFC 6598, Shared Address Space / CGNAT)
 * - 127.0.0.0/8     (loopback)
 * - 169.254.0.0/16  (link-local / cloud metadata)
 * - 172.16.0.0/12   (private)
 * - 192.0.0.0/24    (RFC 6890, IETF Protocol Assignments)
 * - 192.168.0.0/16  (private)
 */
function isPrivateIPv4(num: number): boolean {
  // 0.0.0.0/8
  if (num >>> 24 === 0) return true;
  // 10.0.0.0/8
  if (num >>> 24 === 10) return true;
  // 100.64.0.0/10 — top 10 bits: 01100100 01 = 0x191 = 401
  if (num >>> 22 === 0x191) return true;
  // 127.0.0.0/8
  if (num >>> 24 === 127) return true;
  // 169.254.0.0/16
  if (num >>> 16 === 0xa9fe) return true;
  // 172.16.0.0/12
  if (num >>> 16 >= 0xac10 && num >>> 16 <= 0xac1f) return true;
  // 192.0.0.0/24
  if (num >>> 8 === 0xc00000) return true;
  // 192.168.0.0/16
  if (num >>> 16 === 0xc0a8) return true;
  return false;
}

/**
 * Parse an IPv6 address string into an array of 8 16-bit segments.
 * Handles compressed notation (::), IPv4-mapped (::ffff:x.x.x.x),
 * and IPv4-compatible (::x.x.x.x) formats.
 *
 * @returns Array of 8 segments (each 0-0xffff) or null if invalid
 */
function parseIPv6(ip: string): number[] | null {
  // Handle IPv4 suffix (e.g., "::ffff:127.0.0.1", "::127.0.0.1")
  const v4SuffixMatch = ip.match(/^(.*):((\d{1,3}\.){3}\d{1,3})$/);
  if (v4SuffixMatch) {
    const prefix = v4SuffixMatch[1];
    const v4Part = v4SuffixMatch[2];
    const v4Num = parseIPv4(v4Part);
    if (v4Num === null) return null;
    const high = (v4Num >>> 16) & 0xffff;
    const low = v4Num & 0xffff;
    // prefix ":" (from "::x.x.x.x") means left side of "::" is empty → reconstruct as "::hex:hex"
    // prefix "::ffff" (from "::ffff:x.x.x.x") → reconstruct as "::ffff:hex:hex"
    const normalizedPrefix = prefix === ":" ? "" : prefix;
    const separator = normalizedPrefix === "" ? "::" : ":";
    const expanded = normalizedPrefix + separator + high.toString(16) + ":" + low.toString(16);
    return parseIPv6(expanded);
  }

  const halves = ip.split("::");
  if (halves.length > 2) return null;

  const parseGroup = (s: string): number[] => {
    if (s === "") return [];
    return s.split(":").map((h) => parseInt(h, 16));
  };

  let segments: number[];
  if (halves.length === 2) {
    const left = parseGroup(halves[0]);
    const right = parseGroup(halves[1]);
    const fill = 8 - left.length - right.length;
    if (fill < 0) return null;
    segments = [...left, ...Array(fill).fill(0), ...right];
  } else {
    segments = parseGroup(ip);
  }

  if (segments.length !== 8) return null;
  if (segments.some((s) => !Number.isInteger(s) || s < 0 || s > 0xffff)) return null;

  return segments;
}

/**
 * Check if an IPv6 address (as 8 segments) falls within private/reserved ranges.
 *
 * Covered ranges:
 * - ::              (unspecified)
 * - ::1             (loopback)
 * - fe80::/10       (link-local)
 * - fc00::/7        (unique local)
 * - ::ffff:0:0/96   (IPv4-mapped, delegates to isPrivateIPv4)
 * - ::0:0/96        (IPv4-compatible, delegates to isPrivateIPv4)
 */
function isPrivateIPv6(segments: number[]): boolean {
  // :: (unspecified)
  if (segments.every((s) => s === 0)) return true;
  // ::1 (loopback)
  if (segments.slice(0, 7).every((s) => s === 0) && segments[7] === 1) return true;
  // fe80::/10 (link-local)
  if ((segments[0] & 0xffc0) === 0xfe80) return true;
  // fc00::/7 (unique local)
  if ((segments[0] & 0xfe00) === 0xfc00) return true;

  // ::ffff:x.x.x.x (IPv4-mapped IPv6)
  if (
    segments[0] === 0 &&
    segments[1] === 0 &&
    segments[2] === 0 &&
    segments[3] === 0 &&
    segments[4] === 0 &&
    segments[5] === 0xffff
  ) {
    const ipv4Num = ((segments[6] << 16) | segments[7]) >>> 0;
    return isPrivateIPv4(ipv4Num);
  }

  // ::x.x.x.x (IPv4-compatible IPv6, deprecated but still needs protection)
  if (
    segments[0] === 0 &&
    segments[1] === 0 &&
    segments[2] === 0 &&
    segments[3] === 0 &&
    segments[4] === 0 &&
    segments[5] === 0 &&
    (segments[6] !== 0 || segments[7] !== 0)
  ) {
    const ipv4Num = ((segments[6] << 16) | segments[7]) >>> 0;
    return isPrivateIPv4(ipv4Num);
  }

  return false;
}

const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";
const DOH_TIMEOUT_MS = 3_000;

interface DoHResponse {
  Status: number;
  Answer?: { type: number; data: string }[];
}

/**
 * Resolve a hostname via DNS over HTTPS and validate all returned IPs.
 *
 * **Worker layer runtime validation ONLY.** Do not call from API layer --
 * this performs a network fetch to cloudflare-dns.com which adds latency.
 *
 * @throws {Error} if any resolved IP is private, DNS fails, or DoH times out
 */
export async function resolveAndValidate(hostname: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOH_TIMEOUT_MS);

  try {
    // Fetch A and AAAA records in parallel and consume bodies immediately.
    // Body must be read right after fetch completes to avoid a race where
    // the AbortController fires between fetch() and .json(), making the
    // response body unusable ("Body has already been read").
    const [aData, aaaaData] = await Promise.all([
      fetch(`${DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=A`, {
        headers: { Accept: "application/dns-json" },
        signal: controller.signal,
      }).then((r) => r.json() as Promise<DoHResponse>),
      fetch(`${DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=AAAA`, {
        headers: { Accept: "application/dns-json" },
        signal: controller.signal,
      }).then((r) => r.json() as Promise<DoHResponse>),
    ]);

    const ips: string[] = [];
    if (aData.Answer) {
      for (const ans of aData.Answer) {
        if (ans.type === 1) ips.push(ans.data);
      }
    }
    if (aaaaData.Answer) {
      for (const ans of aaaaData.Answer) {
        if (ans.type === 28) ips.push(ans.data);
      }
    }

    if (ips.length === 0) {
      throw new Error(`SSRF protection: DNS resolution returned no results for ${hostname}`);
    }

    for (const ip of ips) {
      if (isPrivateIP(ip)) {
        throw new Error(`SSRF protection: ${hostname} resolved to private IP ${ip}`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SSRF protection:")) {
      throw err;
    }
    throw new Error(
      `SSRF protection: DNS validation failed for ${hostname} — ${err instanceof Error ? err.message : "unknown error"}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if an IP address string is a private/internal/reserved address.
 * Supports IPv4 (dotted-decimal, octal, hex, integer) and IPv6
 * (compressed, expanded, IPv4-mapped, IPv4-compatible, bracketed).
 *
 * @param ip - IP address string
 * @returns true if the address is private/reserved, false otherwise
 */
export function isPrivateIP(ip: string): boolean {
  let normalized = ip;
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }

  const ipv4Num = parseIPv4(normalized);
  if (ipv4Num !== null) {
    return isPrivateIPv4(ipv4Num);
  }

  const ipv6Segments = parseIPv6(normalized);
  if (ipv6Segments !== null) {
    return isPrivateIPv6(ipv6Segments);
  }

  return false;
}

/**
 * Validate a URL for SSRF safety. Checks protocol, then resolves hostname via DoH.
 *
 * **Worker layer runtime validation ONLY.**
 *
 * @throws {Error} if URL is unsafe (private IP, bad protocol, DNS failure)
 */
export async function assertSafeUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`SSRF protection: invalid URL — ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`SSRF protection: blocked protocol ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;
  await assertSafeHostname(hostname);
}

/**
 * Validate a hostname for SSRF safety. If IP literal, checks directly.
 * If domain name, resolves via DoH and checks all IPs.
 *
 * **Worker layer runtime validation ONLY.**
 *
 * @throws {Error} if hostname resolves to private IP or DNS fails
 */
export async function assertSafeHostname(hostname: string): Promise<void> {
  let normalized = hostname;
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }

  const ipv4Num = parseIPv4(normalized);
  if (ipv4Num !== null) {
    if (isPrivateIPv4(ipv4Num)) {
      throw new Error(`SSRF protection: ${hostname} is a private IP`);
    }
    return;
  }

  const ipv6Segments = parseIPv6(normalized);
  if (ipv6Segments !== null) {
    if (isPrivateIPv6(ipv6Segments)) {
      throw new Error(`SSRF protection: ${hostname} is a private IP`);
    }
    return;
  }

  await resolveAndValidate(normalized);
}

const BLOCKED_HOSTS = ["localhost", "metadata.google.internal"];

/**
 * Static hostname blocklist check for API-layer validation. Normalizes brackets and a trailing dot,
 * blocks localhost names, and classifies IP literals through the same isPrivateIP path.
 * Does NOT resolve DNS; use where DoH latency is unacceptable.
 */
export function isBlockedHost(host: string): boolean {
  let normalized = host.trim().toLowerCase();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }
  if (normalized.endsWith(".")) {
    normalized = normalized.slice(0, -1);
  }

  if (BLOCKED_HOSTS.includes(normalized) || normalized.endsWith(".localhost")) {
    return true;
  }

  if (parseIPv4(normalized) !== null || parseIPv6(normalized) !== null) {
    return isPrivateIP(normalized);
  }

  return false;
}
