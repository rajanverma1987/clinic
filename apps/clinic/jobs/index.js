/**
 * Background Jobs Initialization
 * No cron or scheduled jobs; kept for compatibility with server.js.
 */

/**
 * Initialize background jobs (no-op; no cron jobs in use).
 */
async function initializeJobs() {
  return Promise.resolve();
}

module.exports = { initializeJobs };
