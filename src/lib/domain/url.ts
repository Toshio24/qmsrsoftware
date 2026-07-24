/** Users routinely paste links without a scheme (e.g. "docs.google.com/...").
 * Rather than reject those (an `<input type="url">` does this silently and
 * blocks the whole form), normalize by adding "https://" so the stored value
 * is always a real, clickable URL. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
