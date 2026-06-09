const RESERVED_SCOPES = new Set(['eld', 'pinboard', 'namespace']);

/**
 * Extracts a custom namespace slug from a CADO path such as `/@monalisa/{messageId}`.
 * Returns null for system paths under `/@eld/…` or other reserved scopes.
 *
 * @param {string | null | undefined} cadoPath
 * @returns {string | null}
 */
export function parseCustomNamespaceSlugFromCadoPath(cadoPath) {
  if (!cadoPath || typeof cadoPath !== 'string') return null;

  const match = cadoPath.trim().match(/^\/@([^/]+)\//);
  if (!match) return null;

  const slug = match[1].trim().toLowerCase();
  if (!slug || RESERVED_SCOPES.has(slug)) return null;

  return slug;
}
