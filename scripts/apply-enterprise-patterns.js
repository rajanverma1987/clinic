/**
 * Enterprise Patterns Application Script
 * 
 * Systematically applies enterprise patterns across the codebase:
 * - Replaces console.log with enterprise logger
 * - Adds enterprise documentation
 * - Applies consistent patterns
 * 
 * @module scripts/apply-enterprise-patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Files to process
 */
const TARGET_DIRS = [
  'services',
  'app/api',
  'lib',
  'middleware',
  'components',
];

/**
 * Patterns to replace
 */
const REPLACEMENTS = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    requiresImport: true,
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    requiresImport: true,
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    requiresImport: true,
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    requiresImport: true,
  },
];

/**
 * Check if file needs logger import
 */
function needsLoggerImport(content) {
  return content.includes('logger.') && !content.includes("from '@/lib/utils/logger.js'");
}

/**
 * Add logger import if needed
 */
function addLoggerImport(content) {
  if (!needsLoggerImport(content)) {
    return content;
  }

  // Find last import statement
  const importRegex = /^import\s+.*$/gm;
  const imports = content.match(importRegex) || [];
  
  if (imports.length === 0) {
    // No imports, add at top
    return `import { logger } from '@/lib/utils/logger.js';\n\n${content}`;
  }

  // Add after last import
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const afterLastImport = content.indexOf('\n', lastImportIndex) + 1;
  
  return content.slice(0, afterLastImport) +
         "import { logger } from '@/lib/utils/logger.js';\n" +
         content.slice(afterLastImport);
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply replacements
    for (const { pattern, replacement } of REPLACEMENTS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }

    // Add logger import if needed
    if (modified && needsLoggerImport(content)) {
      content = addLoggerImport(content);
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let processed = 0;

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // Skip node_modules, .git, etc.
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    if (entry.isDirectory()) {
      processed += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      if (processFile(fullPath)) {
        processed++;
      }
    }
  }

  return processed;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Applying enterprise patterns across codebase...\n');

  let totalProcessed = 0;

  for (const dir of TARGET_DIRS) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processing: ${dir}/`);
      const count = processDirectory(dirPath);
      totalProcessed += count;
      console.log(`   Processed ${count} files\n`);
    }
  }

  console.log(`\n✅ Complete! Processed ${totalProcessed} files total.`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processFile, processDirectory, main };
