#!/usr/bin/env node
/**
 * GLSL Shader Linter
 * Validates all .vert and .frag files in the glsl/ directory
 * 
 * Usage: npm run lint:shaders
 * 
 * Requires glslangValidator to be installed:
 *   - Windows: scoop install main/glslang
 *   - macOS:   brew install glslang
 *   - Linux:   sudo apt install glslang-tools
 */

import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const glslDir = join(rootDir, 'glsl');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

/**
 * Check if glslangValidator is available
 * @returns {boolean}
 */
function checkValidator() {
  try {
    execSync('glslangValidator --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a single shader file
 * @param {string} filePath - Path to shader file
 * @returns {{ success: boolean, output: string }}
 */
function validateShader(filePath) {
  try {
    // Run glslangValidator
    const output = execSync(`glslangValidator "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout?.toString() || error.stderr?.toString() || error.message 
    };
  }
}

/**
 * Print installation instructions
 */
function printInstallInstructions() {
  console.log(`${colors.yellow}${colors.bold}glslangValidator not found!${colors.reset}\n`);
  console.log('Install it for your platform:\n');
  console.log(`  ${colors.cyan}Windows (Scoop):${colors.reset}`);
  console.log('    scoop install main/glslang\n');
  console.log(`  ${colors.cyan}Windows (manual):${colors.reset}`);
  console.log('    Download from https://github.com/KhronosGroup/glslang/releases\n');
  console.log(`  ${colors.cyan}macOS:${colors.reset}`);
  console.log('    brew install glslang\n');
  console.log(`  ${colors.cyan}Linux:${colors.reset}`);
  console.log('    sudo apt install glslang-tools\n');
}

/**
 * Main linting function
 */
function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔍 GLSL Shader Linter${colors.reset}\n`);
  
  // Check if validator is available
  if (!checkValidator()) {
    printInstallInstructions();
    process.exit(1);
  }
  
  // Check if glsl directory exists
  if (!existsSync(glslDir)) {
    console.log(`${colors.yellow}⚠ No glsl/ directory found${colors.reset}`);
    process.exit(0);
  }
  
  // Find all shader files
  const files = readdirSync(glslDir).filter(f => 
    f.endsWith('.vert') || 
    f.endsWith('.frag') || 
    f.endsWith('.glsl')
  );
  
  if (files.length === 0) {
    console.log(`${colors.yellow}⚠ No shader files found in glsl/${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`Found ${files.length} shader file(s) in glsl/\n`);
  
  let hasErrors = false;
  let passCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    const filePath = join(glslDir, file);
    const result = validateShader(filePath);
    
    if (result.success) {
      console.log(`${colors.green}✓${colors.reset} ${file}`);
      passCount++;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${file}`);
      // Print error details indented
      const lines = result.output.split('\n').filter(l => l.trim());
      for (const line of lines) {
        console.log(`  ${colors.red}${line}${colors.reset}`);
      }
      console.log('');
      hasErrors = true;
      failCount++;
    }
  }
  
  // Summary
  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`  ${colors.green}${passCount} passed${colors.reset}`);
  if (failCount > 0) {
    console.log(`  ${colors.red}${failCount} failed${colors.reset}`);
  }
  console.log('');
  
  process.exit(hasErrors ? 1 : 0);
}

main();
