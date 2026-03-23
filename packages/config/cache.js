/**
 * Cache layer – no-op. getCache / setCache removed; re-implement when needed.
 */

const DEFAULT_TTL = {
  summary: 60,
  alerts: 30,
  trends: 300,
};

export async function getCache() {
  return null;
}

export async function setCache() {}

export { DEFAULT_TTL };
