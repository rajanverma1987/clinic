/**
 * Background Jobs Initialization
 * Central entry point for all background jobs
 */

const { startDashboardStatsJob } = require('./dashboard-stats');

/**
 * Initialize all background jobs
 */
async function initializeJobs() {
  console.log('🔧 Initializing background jobs...');

  await startDashboardStatsJob();

  console.log('✅ All background jobs initialized');
}

module.exports = { initializeJobs };
