/**
 * Build-time script: generates static JSON from dashboard-structure.
 * Per CursorMD/CLAUDE-AI.md #14 – summary/structure should be computed at build, not runtime.
 *
 * Run from project root: node --experimental-require-module scripts/generate-dashboard-structure-json.js
 * Or add to package.json: "generate:dashboard-json": "node scripts/generate-dashboard-structure-json.js"
 * Output: data/dashboard-structure-summary.json
 *
 * If import fails (e.g. @ alias), use runtime getProjectStructureSummary() or run from Next build context.
 */

const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const summaryPath = path.join(projectRoot, 'data', 'dashboard-structure-summary.json');
const dataDir = path.dirname(summaryPath);

async function run() {
  try {
    const mod = await import(path.join(projectRoot, 'lib', 'constants', 'dashboard-structure.js'));
    const summary = mod.getProjectStructureSummary();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log('Wrote', summaryPath);
  } catch (err) {
    console.error('generate-dashboard-structure-json failed:', err.message);
    console.error(
      'Tip: Dashboard structure uses @ alias; run from Next context or use getProjectStructureSummary() at runtime.',
    );
    process.exit(1);
  }
}

run();
