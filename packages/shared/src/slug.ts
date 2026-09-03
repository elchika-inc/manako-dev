/**
 * Derive a URL slug from a service name.
 * Returns null when the result violates slug constraints (min 2 chars, alphanumeric+hyphen).
 */
export function slugifyServiceName(name: string): string | null {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
  if (slug.length < 2) return null;
  return slug;
}
