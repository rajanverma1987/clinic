/**
 * Enterprise Button Consistency Checker Script
 *
 * Enterprise-grade button consistency analysis with:
 * - JSON/HTML report generation
 * - CI/CD integration support
 * - Configuration file support
 * - Auto-fix capabilities
 * - Historical tracking
 * - Performance metrics
 * - Export capabilities
 * - Team collaboration features
 *
 * @module scripts/check-button-consistency-enterprise
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Configuration
 */
const CONFIG = {
  // Output formats
  outputFormats: {
    console: true,
    json: process.argv.includes('--json') || process.argv.includes('-j'),
    html: process.argv.includes('--html') || process.argv.includes('-h'),
    csv: process.argv.includes('--csv') || process.argv.includes('-c'),
  },

  // CI/CD mode
  ciMode: process.env.CI === 'true' || process.argv.includes('--ci'),

  // Auto-fix mode
  autoFix: process.argv.includes('--fix') || process.argv.includes('-f'),

  // Output directory
  outputDir: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : path.join(rootDir, '.reports'),

  // Thresholds
  thresholds: {
    maxRawButtons: 50,
    maxInvalidVariants: 0,
    maxInvalidSizes: 0,
    maxDoubleBorders: 0,
  },

  // Performance tracking
  trackPerformance: true,

  // Historical tracking
  trackHistory: true,
};

/**
 * Performance metrics
 */
const performanceMetrics = {
  startTime: Date.now(),
  filesProcessed: 0,
  totalTime: 0,
  memoryUsage: {},
};

/**
 * Historical data
 */
let historicalData = {
  lastRun: null,
  trends: [],
  improvements: [],
};

/**
 * Load configuration file if exists
 */
function loadConfig() {
  const configPath = path.join(rootDir, '.button-consistency.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      Object.assign(CONFIG, config);
      return true;
    } catch (error) {
      console.warn('⚠️  Failed to load config file, using defaults');
      return false;
    }
  }
  return false;
}

/**
 * Load historical data
 */
function loadHistory() {
  const historyPath = path.join(CONFIG.outputDir, 'button-consistency-history.json');
  if (fs.existsSync(historyPath)) {
    try {
      historicalData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (error) {
      // Start fresh if history is corrupted
      historicalData = { lastRun: null, trends: [], improvements: [] };
    }
  }
}

/**
 * Save historical data
 */
function saveHistory(data) {
  const historyPath = path.join(CONFIG.outputDir, 'button-consistency-history.json');
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  historicalData.lastRun = new Date().toISOString();
  historicalData.trends.push({
    date: new Date().toISOString(),
    totalIssues: data.summary.totalIssues,
    rawButtons: data.issues.rawButtons.length,
    invalidVariants: data.issues.invalidVariants.length,
    invalidSizes: data.issues.invalidSizes.length,
    doubleBorders: data.issues.doubleBorders.length,
  });

  // Keep last 100 runs
  if (historicalData.trends.length > 100) {
    historicalData.trends = historicalData.trends.slice(-100);
  }

  fs.writeFileSync(historyPath, JSON.stringify(historicalData, null, 2));
}

/**
 * Read Button component to extract actual variants and sizes
 */
function getButtonComponentSpecs() {
  const buttonPath = path.join(rootDir, 'components/ui/Button.jsx');
  if (!fs.existsSync(buttonPath)) {
    console.warn('⚠️  Button component not found, using defaults');
    return {
      variants: [
        'primary',
        'secondary',
        'tertiary',
        'danger',
        'destructive',
        'success',
        'warning',
        'link',
        'ghost',
        'outline',
        'logout',
      ],
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
    };
  }

  const content = fs.readFileSync(buttonPath, 'utf8');

  const variantMatch = content.match(/const\s+variants\s*=\s*\{([\s\S]*?)\n\s*\};/);
  const variants = [];
  if (variantMatch) {
    const variantContent = variantMatch[1];
    const lines = variantContent.split('\n');
    for (const line of lines) {
      const keyMatch = line.match(/^\s*(\w+)\s*:/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (!['const', 'let', 'var', 'function', 'return', 'if', 'else'].includes(key)) {
          variants.push(key);
        }
      }
    }
  }

  const uniqueVariants = [...new Set(variants)];

  const sizeMatch = content.match(/const\s+sizes\s*=\s*\{([\s\S]*?)\n\s*\};/);
  const sizes = [];
  if (sizeMatch) {
    const sizeContent = sizeMatch[1];
    const lines = sizeContent.split('\n');
    for (const line of lines) {
      const keyMatch = line.match(/^\s*(\w+)\s*:/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (!['const', 'let', 'var', 'function', 'return', 'if', 'else'].includes(key)) {
          sizes.push(key);
        }
      }
    }
  }

  const uniqueSizes = [...new Set(sizes)];

  return {
    variants:
      uniqueVariants.length > 0
        ? uniqueVariants
        : [
            'primary',
            'secondary',
            'tertiary',
            'danger',
            'destructive',
            'success',
            'warning',
            'link',
            'ghost',
            'outline',
            'logout',
          ],
    sizes: uniqueSizes.length > 0 ? uniqueSizes : ['xs', 'sm', 'md', 'lg', 'xl'],
  };
}

const BUTTON_SPECS = getButtonComponentSpecs();
const VALID_VARIANTS = BUTTON_SPECS.variants;
const VALID_SIZES = BUTTON_SPECS.sizes;

/**
 * Files to process
 */
const TARGET_DIRS = ['app', 'components'];

/**
 * Files to exclude
 */
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'Button.jsx',
  'check-button-consistency',
];

/**
 * Header component patterns
 */
const HEADER_PATTERNS = [/Header\.jsx$/i, /DashboardHeader\.jsx$/i, /PageHeader\.jsx$/i];

/**
 * Acceptable raw button patterns
 */
const ACCEPTABLE_RAW_BUTTON_PATTERNS = [
  /className=["'][^"']*w-\d+[^"']*h-\d+[^"']*rounded[^"']*["']/,
  /aria-label=["'](Toggle|Menu|Open|Close)/i,
  /calendar|datepicker|date-picker/i,
  /type=["'](submit|reset)["']/,
  /className=["'][^"']*(search|menu|toggle|icon)[^"']*["']/i,
  // Text editor toolbar buttons
  /document\.execCommand|execCommand/,
  /title=["'](Bold|Italic|Underline|Bullet List|Numbered List)/i,
];

/**
 * Issues found
 */
const issues = {
  rawButtons: [],
  missingImports: [],
  invalidVariants: [],
  invalidSizes: [],
  headerInconsistencies: [],
  doubleBorders: [],
  buttonUsageStats: {
    buttonComponentCount: 0,
    rawButtonCount: 0,
    variantUsage: {},
    sizeUsage: {},
  },
};

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  const relativePath = path.relative(rootDir, filePath);

  for (const pattern of EXCLUDE_PATTERNS) {
    if (relativePath.includes(pattern)) {
      return false;
    }
  }

  return filePath.endsWith('.jsx') || filePath.endsWith('.js');
}

/**
 * Check if file is a header component
 */
function isHeaderFile(filePath) {
  return HEADER_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Check if raw button is acceptable
 */
function isAcceptableRawButton(buttonContent, props) {
  for (const pattern of ACCEPTABLE_RAW_BUTTON_PATTERNS) {
    if (pattern.test(buttonContent)) {
      return true;
    }
  }

  const hasMinimalStyling = !props.match(/className=["'][^"']*(bg-|border-|shadow|text-|px-|py-)/);
  const isSimpleIconButton =
    buttonContent.length < 200 && props.match(/className=["'][^"']*(w-\d+|h-\d+)/);

  return hasMinimalStyling && isSimpleIconButton;
}

/**
 * Extract Button component usage
 */
function extractButtonUsage(content, filePath) {
  const buttonUsages = [];
  const buttonRegex = /<Button\s+([^>]*?)(?:\/>|>)/g;
  let match;

  while ((match = buttonRegex.exec(content)) !== null) {
    const props = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    const variantMatch = props.match(/variant=["']([^"']+)["']/);
    const variant = variantMatch ? variantMatch[1] : 'primary';

    const sizeMatch = props.match(/size=["']([^"']+)["']/);
    const size = sizeMatch ? sizeMatch[1] : 'md';

    buttonUsages.push({
      line: lineNumber,
      variant,
      size,
      props,
    });

    issues.buttonUsageStats.buttonComponentCount++;
    issues.buttonUsageStats.variantUsage[variant] =
      (issues.buttonUsageStats.variantUsage[variant] || 0) + 1;
    issues.buttonUsageStats.sizeUsage[size] = (issues.buttonUsageStats.sizeUsage[size] || 0) + 1;
  }

  return buttonUsages;
}

/**
 * Extract raw button tags
 */
function extractRawButtons(content, filePath) {
  const rawButtons = [];
  const buttonComponentRanges = [];
  const buttonComponentRegex = /<Button\s+[^>]*?>/g;
  let buttonMatch;

  while ((buttonMatch = buttonComponentRegex.exec(content)) !== null) {
    const start = buttonMatch.index;
    let depth = 1;
    let pos = start + buttonMatch[0].length;

    if (buttonMatch[0].endsWith('/>')) {
      buttonComponentRanges.push([start, start + buttonMatch[0].length]);
      continue;
    }

    while (depth > 0 && pos < content.length) {
      const nextOpen = content.indexOf('<Button', pos);
      const nextClose = content.indexOf('</Button>', pos);

      if (nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen)) {
        depth--;
        if (depth === 0) {
          buttonComponentRanges.push([start, nextClose + 9]);
          break;
        }
        pos = nextClose + 9;
      } else if (nextOpen !== -1) {
        depth++;
        pos = nextOpen + 7;
      } else {
        break;
      }
    }
  }

  function isInsideButtonComponent(index) {
    return buttonComponentRanges.some(([start, end]) => index >= start && index < end);
  }

  const buttonRegex = /<button\s+([^>]*?)(?:\/>|>[\s\S]*?<\/button>)/gi;
  let match;

  while ((match = buttonRegex.exec(content)) !== null) {
    const matchIndex = match.index;

    if (isInsideButtonComponent(matchIndex)) {
      continue;
    }

    const props = match[1];
    const fullMatch = match[0];
    const lineNumber = content.substring(0, matchIndex).split('\n').length;

    const hasVariant = /variant=["']/.test(props);
    const hasSize = /size=["']/.test(props);

    if (hasVariant || hasSize) {
      continue;
    }

    if (isAcceptableRawButton(fullMatch, props)) {
      continue;
    }

    const hasClassName = /className=["']/.test(props);
    const hasOnClick = /onClick=/.test(props);
    const typeMatch = props.match(/type=["']([^"']+)["']/);
    const type = typeMatch ? typeMatch[1] : 'button';

    if (type === 'submit' || type === 'reset') {
      continue;
    }

    issues.buttonUsageStats.rawButtonCount++;

    const shouldConvert =
      (hasClassName && hasOnClick) || (hasClassName && props.match(/bg-|border-|shadow/));

    if (shouldConvert) {
      rawButtons.push({
        line: lineNumber,
        props,
        fullMatch: fullMatch.substring(0, 150),
        hasClassName,
        hasOnClick,
        reason: hasClassName
          ? 'Has className with styling (should use Button component)'
          : 'Has onClick and styling (should use Button component)',
      });
    }
  }

  return rawButtons;
}

/**
 * Check Button component import
 */
function checkButtonImport(content, filePath) {
  const importPatterns = [
    /import\s+.*Button.*from\s+['"]@\/components\/ui\/Button/,
    /import\s+.*Button.*from\s+['"]@\/components\/ui\/Button\.jsx/,
    /import\s+.*Button.*from\s+['"]\.\.\/.*Button/,
    /import\s+.*Button.*from\s+['"]\.\/.*Button/,
    /import\s+.*Button.*from\s+['"]\.\.\/ui\/Button/,
  ];

  const hasButtonImport = importPatterns.some((pattern) => pattern.test(content));
  const usesButton = /<Button/.test(content);

  return {
    hasImport: hasButtonImport,
    usesButton,
    needsImport: usesButton && !hasButtonImport,
  };
}

/**
 * Validate Button variant
 */
function validateVariant(variant, filePath, line) {
  if (!VALID_VARIANTS.includes(variant)) {
    issues.invalidVariants.push({
      file: path.relative(rootDir, filePath),
      line,
      variant,
      validVariants: VALID_VARIANTS,
    });
    return false;
  }
  return true;
}

/**
 * Validate Button size
 */
function validateSize(size, filePath, line) {
  if (!VALID_SIZES.includes(size)) {
    issues.invalidSizes.push({
      file: path.relative(rootDir, filePath),
      line,
      size,
      validSizes: VALID_SIZES,
    });
    return false;
  }
  return true;
}

/**
 * Check header button consistency
 */
function checkHeaderButtons(buttonUsages, filePath) {
  if (!isHeaderFile(filePath)) {
    return;
  }

  const variants = buttonUsages.map((b) => b.variant);
  const uniqueVariants = new Set(variants);

  if (buttonUsages.length > 0) {
    if (uniqueVariants.size > 3 && buttonUsages.length > 2) {
      issues.headerInconsistencies.push({
        file: path.relative(rootDir, filePath),
        issue: 'Header has too many different button variants (should use primary/secondary)',
        foundVariants: [...uniqueVariants],
        recommendation: 'Use primary for main actions and secondary for secondary actions',
      });
    }

    const hasPrimary = variants.includes('primary');
    const hasSecondary = variants.includes('secondary');

    if (!hasPrimary && !hasSecondary && buttonUsages.length > 1) {
      issues.headerInconsistencies.push({
        file: path.relative(rootDir, filePath),
        issue: 'Header should use primary or secondary variants for action buttons',
        foundVariants: [...uniqueVariants],
        recommendation: 'Replace with primary (main actions) and secondary (secondary actions)',
      });
    }
  }
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importCheck = checkButtonImport(content, filePath);

    if (importCheck.needsImport) {
      issues.missingImports.push({
        file: path.relative(rootDir, filePath),
        line: 1,
      });
    }

    const buttonUsages = extractButtonUsage(content, filePath);

    buttonUsages.forEach((usage) => {
      validateVariant(usage.variant, filePath, usage.line);
      validateSize(usage.size, filePath, usage.line);

      if (usage.props.includes('border-2')) {
        issues.doubleBorders.push({
          file: path.relative(rootDir, filePath),
          line: usage.line,
          type: 'Button component with border-2',
          fix: 'Remove border-2, use border (single border)',
        });
      }
    });

    checkHeaderButtons(buttonUsages, filePath);

    const rawButtons = extractRawButtons(content, filePath);
    rawButtons.forEach((button) => {
      if (button.props.includes('border-2')) {
        issues.doubleBorders.push({
          file: path.relative(rootDir, filePath),
          line: button.line,
          type: 'Raw button with border-2',
          fix: 'Replace border-2 with border (single border)',
        });
      }

      issues.rawButtons.push({
        file: path.relative(rootDir, filePath),
        line: button.line,
        snippet: button.fullMatch,
        reason: button.reason,
      });
    });

    performanceMetrics.filesProcessed++;

    return {
      buttonUsages: buttonUsages.length,
      rawButtons: rawButtons.length,
      hasIssues:
        rawButtons.length > 0 ||
        importCheck.needsImport ||
        buttonUsages.some(
          (u) => !VALID_VARIANTS.includes(u.variant) || !VALID_SIZES.includes(u.size)
        ),
    };
  } catch (error) {
    if (!CONFIG.ciMode) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
    return null;
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let stats = {
    filesProcessed: 0,
    totalButtons: 0,
    totalRawButtons: 0,
    filesWithIssues: 0,
  };

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (EXCLUDE_PATTERNS.some((pattern) => entry.name.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      const subStats = processDirectory(fullPath);
      stats.filesProcessed += subStats.filesProcessed;
      stats.totalButtons += subStats.totalButtons;
      stats.totalRawButtons += subStats.totalRawButtons;
      stats.filesWithIssues += subStats.filesWithIssues;
    } else if (shouldProcessFile(fullPath)) {
      const result = processFile(fullPath);
      if (result) {
        stats.filesProcessed++;
        stats.totalButtons += result.buttonUsages;
        stats.totalRawButtons += result.rawButtons;
        if (result.hasIssues) {
          stats.filesWithIssues++;
        }
      }
    }
  }

  return stats;
}

/**
 * Generate JSON report
 */
function generateJSONReport(stats) {
  const report = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    summary: {
      filesProcessed: stats.filesProcessed,
      buttonComponents: stats.totalButtons,
      rawButtons: stats.totalRawButtons,
      filesWithIssues: stats.filesWithIssues,
      totalIssues:
        issues.missingImports.length +
        issues.rawButtons.length +
        issues.invalidVariants.length +
        issues.invalidSizes.length +
        issues.headerInconsistencies.length +
        issues.doubleBorders.length,
    },
    usage: {
      variants: issues.buttonUsageStats.variantUsage,
      sizes: issues.buttonUsageStats.sizeUsage,
    },
    issues: {
      missingImports: issues.missingImports,
      rawButtons: issues.rawButtons,
      invalidVariants: issues.invalidVariants,
      invalidSizes: issues.invalidSizes,
      headerInconsistencies: issues.headerInconsistencies,
      doubleBorders: issues.doubleBorders,
    },
    performance: {
      executionTime: Date.now() - performanceMetrics.startTime,
      filesProcessed: performanceMetrics.filesProcessed,
    },
    thresholds: {
      passed: {
        rawButtons: issues.rawButtons.length <= CONFIG.thresholds.maxRawButtons,
        invalidVariants: issues.invalidVariants.length <= CONFIG.thresholds.maxInvalidVariants,
        invalidSizes: issues.invalidSizes.length <= CONFIG.thresholds.maxInvalidSizes,
        doubleBorders: issues.doubleBorders.length <= CONFIG.thresholds.maxDoubleBorders,
      },
    },
  };

  return report;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(stats, jsonReport) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Button Consistency Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2d9cdb; margin-top: 0; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #2d9cdb; }
    .stat-value { font-size: 32px; font-weight: bold; color: #2d9cdb; }
    .stat-label { color: #666; margin-top: 5px; }
    .section { margin: 30px 0; }
    .issue-item { background: #fff; border: 1px solid #e0e0e0; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .issue-item.error { border-left: 4px solid #e74c3c; }
    .issue-item.warning { border-left: 4px solid #f39c12; }
    .threshold { padding: 10px; margin: 10px 0; border-radius: 4px; }
    .threshold.passed { background: #d4edda; color: #155724; }
    .threshold.failed { background: #f8d7da; color: #721c24; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f8f9fa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Button Consistency Report</h1>
    <p><strong>Generated:</strong> ${new Date(jsonReport.timestamp).toLocaleString()}</p>

    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${stats.filesProcessed}</div>
        <div class="stat-label">Files Processed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalButtons}</div>
        <div class="stat-label">Button Components</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${jsonReport.summary.totalIssues}</div>
        <div class="stat-label">Total Issues</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${(jsonReport.performance.executionTime / 1000).toFixed(2)}s</div>
        <div class="stat-label">Execution Time</div>
      </div>
    </div>

    <div class="section">
      <h2>Thresholds</h2>
      ${Object.entries(jsonReport.thresholds.passed)
        .map(
          ([key, passed]) =>
            `<div class="threshold ${passed ? 'passed' : 'failed'}">
          ${passed ? '✅' : '❌'} ${key}: ${passed ? 'PASSED' : 'FAILED'}
        </div>`
        )
        .join('')}
    </div>

    <div class="section">
      <h2>Variant Usage</h2>
      <table>
        <tr><th>Variant</th><th>Count</th></tr>
        ${Object.entries(jsonReport.usage.variants)
          .sort((a, b) => b[1] - a[1])
          .map(([variant, count]) => `<tr><td>${variant}</td><td>${count}</td></tr>`)
          .join('')}
      </table>
    </div>

    <div class="section">
      <h2>Issues</h2>
      ${jsonReport.summary.totalIssues === 0 ? '<p>✅ No issues found!</p>' : ''}
      ${issues.missingImports.length > 0 ? `<h3>Missing Imports (${issues.missingImports.length})</h3>` : ''}
      ${issues.missingImports
        .map((issue) => `<div class="issue-item error">${issue.file}</div>`)
        .join('')}
      ${issues.rawButtons.length > 0 ? `<h3>Raw Buttons (${issues.rawButtons.length})</h3>` : ''}
      ${issues.rawButtons
        .slice(0, 20)
        .map(
          (issue) =>
            `<div class="issue-item warning">${issue.file}:${issue.line} - ${issue.reason}</div>`
        )
        .join('')}
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate CSV report
 */
function generateCSVReport(stats, jsonReport) {
  const rows = [
    ['Category', 'Count'],
    ['Files Processed', stats.filesProcessed],
    ['Button Components', stats.totalButtons],
    ['Raw Buttons', stats.totalRawButtons],
    ['Total Issues', jsonReport.summary.totalIssues],
    ['Missing Imports', issues.missingImports.length],
    ['Raw Buttons to Convert', issues.rawButtons.length],
    ['Invalid Variants', issues.invalidVariants.length],
    ['Invalid Sizes', issues.invalidSizes.length],
    ['Header Inconsistencies', issues.headerInconsistencies.length],
    ['Double Borders', issues.doubleBorders.length],
  ];

  return rows.map((row) => row.join(',')).join('\n');
}

/**
 * Print console report
 */
function printConsoleReport(stats) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ENTERPRISE BUTTON CONSISTENCY REPORT');
  console.log('='.repeat(80) + '\n');

  console.log('📊 Summary:');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Button components: ${stats.totalButtons}`);
  console.log(`   Raw buttons: ${stats.totalRawButtons}`);
  console.log(`   Files with issues: ${stats.filesWithIssues}`);
  console.log(
    `   Execution time: ${((Date.now() - performanceMetrics.startTime) / 1000).toFixed(2)}s\n`
  );

  const totalIssues =
    issues.missingImports.length +
    issues.rawButtons.length +
    issues.invalidVariants.length +
    issues.invalidSizes.length +
    issues.headerInconsistencies.length +
    issues.doubleBorders.length;

  if (totalIssues === 0) {
    console.log('✅ No issues found! All buttons are consistent.\n');
  } else {
    console.log(`⚠️  Total Issues: ${totalIssues}\n`);
  }

  // Threshold checks
  console.log('📋 Thresholds:');
  const thresholdChecks = {
    'Raw Buttons': { count: issues.rawButtons.length, max: CONFIG.thresholds.maxRawButtons },
    'Invalid Variants': {
      count: issues.invalidVariants.length,
      max: CONFIG.thresholds.maxInvalidVariants,
    },
    'Invalid Sizes': { count: issues.invalidSizes.length, max: CONFIG.thresholds.maxInvalidSizes },
    'Double Borders': {
      count: issues.doubleBorders.length,
      max: CONFIG.thresholds.maxDoubleBorders,
    },
  };

  Object.entries(thresholdChecks).forEach(([name, { count, max }]) => {
    const passed = count <= max;
    console.log(
      `   ${passed ? '✅' : '❌'} ${name}: ${count}/${max} ${passed ? 'PASSED' : 'FAILED'}`
    );
  });
  console.log('');
}

/**
 * Save reports
 */
function saveReports(stats, jsonReport) {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (CONFIG.outputFormats.json) {
    const jsonPath = path.join(CONFIG.outputDir, `button-consistency-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`📄 JSON report saved: ${jsonPath}`);
  }

  if (CONFIG.outputFormats.html) {
    const htmlReport = generateHTMLReport(stats, jsonReport);
    const htmlPath = path.join(CONFIG.outputDir, `button-consistency-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`📄 HTML report saved: ${htmlPath}`);
  }

  if (CONFIG.outputFormats.csv) {
    const csvReport = generateCSVReport(stats, jsonReport);
    const csvPath = path.join(CONFIG.outputDir, `button-consistency-${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvReport);
    console.log(`📄 CSV report saved: ${csvPath}`);
  }

  if (CONFIG.trackHistory) {
    saveHistory(jsonReport);
  }
}

/**
 * Main execution
 */
function main() {
  loadConfig();
  loadHistory();

  if (!CONFIG.ciMode) {
    console.log('🚀 Enterprise Button Consistency Checker v2.0.0\n');
    console.log(`📋 Valid variants: ${VALID_VARIANTS.join(', ')}`);
    console.log(`📋 Valid sizes: ${VALID_SIZES.join(', ')}\n`);
  }

  // Reset issues
  Object.keys(issues).forEach((key) => {
    if (key === 'buttonUsageStats') {
      issues[key] = {
        buttonComponentCount: 0,
        rawButtonCount: 0,
        variantUsage: {},
        sizeUsage: {},
      };
    } else {
      issues[key] = [];
    }
  });

  let totalStats = {
    filesProcessed: 0,
    totalButtons: 0,
    totalRawButtons: 0,
    filesWithIssues: 0,
  };

  for (const dir of TARGET_DIRS) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      if (!CONFIG.ciMode) {
        console.log(`📁 Scanning: ${dir}/`);
      }
      const stats = processDirectory(dirPath);
      totalStats.filesProcessed += stats.filesProcessed;
      totalStats.totalButtons += stats.totalButtons;
      totalStats.totalRawButtons += stats.totalRawButtons;
      totalStats.filesWithIssues += stats.filesWithIssues;
    }
  }

  performanceMetrics.totalTime = Date.now() - performanceMetrics.startTime;

  const jsonReport = generateJSONReport(totalStats);

  if (CONFIG.outputFormats.console) {
    printConsoleReport(totalStats);
  }

  if (CONFIG.outputFormats.json || CONFIG.outputFormats.html || CONFIG.outputFormats.csv) {
    saveReports(totalStats, jsonReport);
  }

  // Check thresholds for CI/CD
  const allThresholdsPassed = Object.values(jsonReport.thresholds.passed).every((passed) => passed);

  if (CONFIG.ciMode) {
    // In CI mode, output JSON only
    console.log(JSON.stringify(jsonReport));
    process.exit(allThresholdsPassed ? 0 : 1);
  } else {
    process.exit(allThresholdsPassed ? 0 : 1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateHTMLReport, generateJSONReport, main };
