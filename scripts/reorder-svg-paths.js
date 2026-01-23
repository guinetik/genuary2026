/**
 * Reorder SVG paths by position (top-to-bottom, left-to-right)
 * 
 * This script handles SVGs where multiple shapes are combined into a single
 * path element with multiple subpaths (each starting with M).
 * 
 * Usage: node reorder-svg-paths.js input.svg output.svg
 */

import fs from 'fs';

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node reorder-svg-paths.js <input.svg> [output.svg]');
  console.log('If output.svg is not specified, will write to input-sorted.svg');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace('.svg', '-sorted.svg');

console.log(`Reading: ${inputFile}`);
const svgContent = fs.readFileSync(inputFile, 'utf8');

/**
 * Split a combined path d attribute into individual subpaths
 * Each subpath starts with M (moveto) command
 */
function splitSubpaths(pathD) {
  const subpaths = [];
  // Split on M but keep the M with the following content
  // This regex finds M followed by everything until the next M or end
  const regex = /M[^M]+/gi;
  let match;
  while ((match = regex.exec(pathD)) !== null) {
    subpaths.push(match[0].trim());
  }
  return subpaths;
}

/**
 * Extract the bounding box / center position from a subpath
 */
function getSubpathPosition(pathD) {
  // Look for the first M (moveto) command to get starting position
  const moveMatch = pathD.match(/M\s*([\d.-]+)[,\s]+([\d.-]+)/i);
  if (!moveMatch) return { x: 0, y: 0 };
  
  const startX = parseFloat(moveMatch[1]);
  const startY = parseFloat(moveMatch[2]);
  
  // Parse all coordinates to get bounding box
  const coordMatches = pathD.match(/[\d.-]+/g);
  if (coordMatches && coordMatches.length >= 4) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (let i = 0; i < coordMatches.length - 1; i += 2) {
      const x = parseFloat(coordMatches[i]);
      const y = parseFloat(coordMatches[i + 1]);
      if (!isNaN(x) && !isNaN(y) && x > 0 && y > 0 && x < 1000 && y < 1000) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    
    if (isFinite(minX) && isFinite(minY)) {
      return {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        minX, minY, maxX, maxY
      };
    }
  }
  
  return { x: startX, y: startY };
}

// Extract the path element
const pathMatch = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/i);
if (!pathMatch) {
  console.error('No path element with d attribute found');
  process.exit(1);
}

const fullPathD = pathMatch[1];
const pathElement = pathMatch[0];

// Get path attributes (everything except d)
const pathAttrsMatch = pathElement.match(/<path([^>]*)>/i);
let pathAttrs = pathAttrsMatch ? pathAttrsMatch[1] : '';
// Remove the d attribute from attrs since we'll add it back
pathAttrs = pathAttrs.replace(/\s*d="[^"]*"/i, '').trim();

console.log(`Path attributes: ${pathAttrs.substring(0, 50)}...`);

// Split into subpaths
const subpaths = splitSubpaths(fullPathD);
console.log(`Found ${subpaths.length} subpaths (individual shapes)`);

if (subpaths.length <= 1) {
  console.log('Only one subpath found, nothing to reorder');
  process.exit(0);
}

// Parse each subpath and store with position
const subpathsWithPosition = subpaths.map((subpath, index) => {
  const pos = getSubpathPosition(subpath);
  return {
    d: subpath,
    ...pos,
    index
  };
});

// Sort by Y first (top to bottom), then by X (left to right)
// Use a grid-based approach to group elements that are roughly on the same row
const gridSize = 3.5; // Tolerance for "same row" - adjust based on square size

subpathsWithPosition.sort((a, b) => {
  // Round Y to grid to group elements on same row
  const rowA = Math.round(a.y / gridSize) * gridSize;
  const rowB = Math.round(b.y / gridSize) * gridSize;
  
  if (rowA !== rowB) {
    return rowA - rowB; // Sort by row (top to bottom)
  }
  return a.x - b.x; // Within same row, sort left to right
});

console.log(`Sorted subpaths from top-left to bottom-right`);

// Sample first few and last few positions for verification
console.log('\nFirst 5 positions after sorting:');
subpathsWithPosition.slice(0, 5).forEach((p, i) => {
  console.log(`  ${i}: x=${p.x.toFixed(1)}, y=${p.y.toFixed(1)}`);
});
console.log('\nLast 5 positions:');
subpathsWithPosition.slice(-5).forEach((p, i) => {
  console.log(`  ${subpathsWithPosition.length - 5 + i}: x=${p.x.toFixed(1)}, y=${p.y.toFixed(1)}`);
});

// Reconstruct the path d attribute with sorted subpaths
const sortedD = subpathsWithPosition.map(p => p.d).join(' ');

// Build new path element
const newPathElement = `<path ${pathAttrs} d="${sortedD}"/>`;

// Replace old path in SVG
let newSvg = svgContent.replace(/<path[^>]*d="[^"]*"[^>]*\/?>/i, newPathElement);

// Write output
fs.writeFileSync(outputFile, newSvg);
console.log(`\nWritten sorted SVG to: ${outputFile}`);
