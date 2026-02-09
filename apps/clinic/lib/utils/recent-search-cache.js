/**
 * Cache recent searches in localStorage (per scope) for quick re-use.
 * Doc: "Search: Debounced 300ms, cache recent searches in localStorage"
 */

const PREFIX = 'clinic_recent_search:';
const MAX_RECENT = 10;

function storageKey(scope) {
  return `${PREFIX}${scope || 'default'}`;
}

export function getRecentSearches(scope = 'default') {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(scope, term) {
  if (typeof window === 'undefined' || !term || typeof term !== 'string') return;
  const trimmed = term.trim();
  if (!trimmed) return;
  try {
    const list = getRecentSearches(scope).filter((t) => t !== trimmed);
    list.unshift(trimmed);
    localStorage.setItem(storageKey(scope), JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch (_) {}
}

export function clearRecentSearches(scope) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(scope));
  } catch (_) {}
}
