/**
 * Background Jobs Initialization
 * Central entry point for all background jobs
 */

const { startDashboardStatsJob } = require('./dashboard-stats');

/**
 * Initialize all background jobs
 */
function initializeJobs() {
  console.log('🔧 Initializing background jobs...');

  startDashboardStatsJob();

  console.log('✅ All background jobs initialized');
}

module.exports = { initializeJobs };
