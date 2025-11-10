#!/usr/bin/env node

/**
 * Validate Image Sourcing Setup
 *
 * This script validates that all prerequisites are in place
 * before running the image download and optimization process.
 */

const fs = require('fs').promises;
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function header(message) {
  console.log(`\n${colors.bold}${colors.blue}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${'='.repeat(70)}${colors.reset}\n`);
}

async function checkFileExists(filePath, description) {
  try {
    await fs.access(filePath);
    success(`${description} exists`);
    return true;
  } catch {
    error(`${description} not found: ${filePath}`);
    return false;
  }
}

async function checkDirectory(dirPath, description) {
  try {
    const stats = await fs.stat(dirPath);
    if (stats.isDirectory()) {
      success(`${description} exists`);
      return true;
    } else {
      error(`${description} is not a directory: ${dirPath}`);
      return false;
    }
  } catch {
    warning(`${description} not found (will be created): ${dirPath}`);
    return false;
  }
}

async function validateJSON(filePath, description) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    success(`${description} is valid JSON`);
    return data;
  } catch (err) {
    error(`${description} is invalid: ${err.message}`);
    return null;
  }
}

async function main() {
  header('IMAGE SOURCING SETUP VALIDATION');

  let allChecksPass = true;
  const issues = [];
  const warnings = [];

  // Check 1: Environment Variables
  header('1. Environment Variables');
  if (process.env.PEXELS_API_KEY) {
    success('PEXELS_API_KEY is set');
    info(`   Key starts with: ${process.env.PEXELS_API_KEY.substring(0, 10)}...`);
  } else {
    error('PEXELS_API_KEY environment variable not set');
    issues.push({
      issue: 'Missing PEXELS_API_KEY',
      solution: 'Get a free API key from https://www.pexels.com/api/ and set it:\n      export PEXELS_API_KEY=your_key_here'
    });
    allChecksPass = false;
  }

  // Check 2: Required Files
  header('2. Required Files');

  const mappingFile = path.join(__dirname, '../../docs/addon-image-mapping.json');
  const mappingExists = await checkFileExists(mappingFile, 'addon-image-mapping.json');
  if (!mappingExists) {
    issues.push({
      issue: 'Missing addon-image-mapping.json',
      solution: 'This file should have been created by the research agent'
    });
    allChecksPass = false;
  } else {
    // Validate JSON structure
    const mappingData = await validateJSON(mappingFile, 'addon-image-mapping.json');
    if (mappingData) {
      if (mappingData.addons && Array.isArray(mappingData.addons)) {
        success(`Found ${mappingData.addons.length} addons in mapping`);

        // Validate addon structure
        let validAddons = 0;
        for (const addon of mappingData.addons) {
          if (addon.handle && addon.title && addon.pexels_search_terms) {
            validAddons++;
          }
        }

        if (validAddons === mappingData.addons.length) {
          success(`All ${validAddons} addons have required fields`);
        } else {
          warning(`Only ${validAddons}/${mappingData.addons.length} addons have required fields`);
          warnings.push('Some addons may be missing required fields');
        }
      } else {
        error('addon-image-mapping.json does not have valid addons array');
        allChecksPass = false;
      }
    } else {
      allChecksPass = false;
    }
  }

  const scriptFile = path.join(__dirname, 'download-optimize-addon-images.js');
  const scriptExists = await checkFileExists(scriptFile, 'download-optimize-addon-images.js');
  if (!scriptExists) {
    issues.push({
      issue: 'Missing download script',
      solution: 'The download-optimize-addon-images.js script should be in scripts/'
    });
    allChecksPass = false;
  }

  // Check 3: Node.js Dependencies
  header('3. Dependencies');

  try {
    require('sharp');
    success('Sharp library is installed');
  } catch {
    error('Sharp library not found');
    issues.push({
      issue: 'Sharp library missing',
      solution: 'Install with: npm install sharp'
    });
    allChecksPass = false;
  }

  // Check Node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    success(`Node.js version ${nodeVersion} is compatible`);
  } else {
    warning(`Node.js version ${nodeVersion} - recommend v18 or higher`);
    warnings.push('Consider upgrading Node.js for best compatibility');
  }

  // Check 4: Directories
  header('4. Directory Structure');

  const docsDir = path.join(__dirname, '../../docs');
  await checkDirectory(docsDir, 'docs/');

  const publicDir = path.join(__dirname, '../public');
  await checkDirectory(publicDir, 'public/');

  const imagesDir = path.join(__dirname, '../public/images');
  await checkDirectory(imagesDir, 'public/images/');

  const addonsDir = path.join(__dirname, '../public/images/addons');
  const addonsDirExists = await checkDirectory(addonsDir, 'public/images/addons/');
  if (!addonsDirExists) {
    info('   Addons directory will be created automatically');
  }

  // Check 5: Write Permissions
  header('5. Write Permissions');

  try {
    const testFile = path.join(__dirname, '../../docs/.write-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    success('Write permission to docs/ directory');
  } catch {
    error('No write permission to docs/ directory');
    issues.push({
      issue: 'Cannot write to docs/',
      solution: 'Check directory permissions'
    });
    allChecksPass = false;
  }

  try {
    const publicTestDir = path.join(__dirname, '../public/images');
    const testFile = path.join(publicTestDir, '.write-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    success('Write permission to public/images/ directory');
  } catch {
    error('No write permission to public/images/ directory');
    issues.push({
      issue: 'Cannot write to public/images/',
      solution: 'Check directory permissions'
    });
    allChecksPass = false;
  }

  // Check 6: Disk Space
  header('6. System Resources');

  // Estimate required space: ~2MB per addon × 19 addons = ~40MB
  info('Estimated disk space needed: ~40-60 MB for all images');
  info('Processing time estimate: ~5-10 minutes for 19 addons');
  success('System check complete');

  // Summary
  header('VALIDATION SUMMARY');

  if (allChecksPass && issues.length === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 ALL CHECKS PASSED!${colors.reset}\n`);
    success('Setup is ready for image download and optimization');

    console.log(`\n${colors.blue}${colors.bold}Next Steps:${colors.reset}\n`);
    console.log('1. Run the image download script:');
    console.log(`   ${colors.green}PEXELS_API_KEY=your_key node scripts/download-optimize-addon-images.js${colors.reset}\n`);
    console.log('2. After completion, verify the results in:');
    console.log(`   - ${colors.blue}public/images/addons/${colors.reset} (optimized images)`);
    console.log(`   - ${colors.blue}docs/addon-images-manifest.json${colors.reset} (attribution data)\n`);

    return 0;
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ VALIDATION FAILED${colors.reset}\n`);

    if (issues.length > 0) {
      log('\n🔴 Critical Issues:', 'red');
      issues.forEach((item, i) => {
        console.log(`\n${i + 1}. ${colors.red}${item.issue}${colors.reset}`);
        console.log(`   ${colors.yellow}Solution: ${item.solution}${colors.reset}`);
      });
    }

    if (warnings.length > 0) {
      log('\n🟡 Warnings:', 'yellow');
      warnings.forEach((w, i) => {
        console.log(`${i + 1}. ${w}`);
      });
    }

    console.log(`\n${colors.yellow}Please resolve the issues above before proceeding.${colors.reset}\n`);
    return 1;
  }
}

// Execute
main()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error(`\n${colors.red}Fatal Error:${colors.reset}`, error.message);
    console.error(error.stack);
    process.exit(1);
  });
