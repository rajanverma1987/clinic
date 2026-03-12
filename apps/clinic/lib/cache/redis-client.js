/**
 * Redis client – no-op. Caching disabled; re-implement when needed.
 */

export async function getRedisClient() {
  return null;
}

export async function getCache() {
  return null;
}

export async function setCache() {
  return false;
}

export async function deleteCache() {
  return false;
}

export async function deleteCachePattern() {
  return 0;
}

export async function checkRedisHealth() {
  return { available: false, reason: 'caching disabled' };
}

export default getRedisClient;
