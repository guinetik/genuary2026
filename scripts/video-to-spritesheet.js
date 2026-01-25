#!/usr/bin/env node
/**
 * Video to Spritesheet Converter
 * 
 * @fileoverview Converts a video file to a spritesheet using ffmpeg
 * 
 * Usage:
 *   node scripts/video-to-spritesheet.js <input-video> [options]
 * 
 * Options:
 *   --output, -o    Output path (default: same dir as input, with .png extension)
 *   --frames, -f    Number of frames to extract (default: 50)
 *   --cols, -c      Number of columns in grid (default: 10)
 *   --size, -s      Frame size WxH (default: 120x120)
 *   --fps           Source fps to sample at (default: use video fps)
 *   --temp          Temp directory for frames (default: system temp)
 * 
 * Examples:
 *   node scripts/video-to-spritesheet.js video.mp4
 *   node scripts/video-to-spritesheet.js video.mp4 -o spritesheet.png -f 48 -c 8 -s 64x64
 * 
 * @author guinetik
 */

import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { tmpdir } from 'os';

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Video to Spritesheet Converter

Usage:
  node scripts/video-to-spritesheet.js <input-video> [options]

Options:
  --output, -o    Output path (default: same dir as input, with .png extension)
  --frames, -f    Number of frames to extract (default: 50)
  --cols, -c      Number of columns in grid (default: 10)
  --size, -s      Frame size WxH (default: 120x120)
  --temp          Temp directory for frames (default: system temp)

Examples:
  node scripts/video-to-spritesheet.js video.mp4
  node scripts/video-to-spritesheet.js video.mp4 -o spritesheet.png -f 48 -c 8 -s 64x64
`);
  process.exit(0);
}

// Helper to get arg value
function getArg(names, defaultValue) {
  for (const name of names) {
    const idx = args.indexOf(name);
    if (idx !== -1 && args[idx + 1]) {
      return args[idx + 1];
    }
  }
  return defaultValue;
}

// Parse options
const inputVideo = args[0];
const frames = parseInt(getArg(['--frames', '-f'], '50'), 10);
const cols = parseInt(getArg(['--cols', '-c'], '10'), 10);
const size = getArg(['--size', '-s'], '120x120');
const [frameW, frameH] = size.split('x').map(Number);
const rows = Math.ceil(frames / cols);

// Output path
const defaultOutput = join(
  dirname(inputVideo),
  basename(inputVideo, extname(inputVideo)) + '_spritesheet.png'
);
const output = getArg(['--output', '-o'], defaultOutput);

// Temp directory for frames
const tempDir = join(
  getArg(['--temp'], tmpdir()),
  `spritesheet_${Date.now()}`
);

console.log(`
╔════════════════════════════════════════╗
║     Video to Spritesheet Converter     ║
╚════════════════════════════════════════╝

Input:    ${inputVideo}
Output:   ${output}
Frames:   ${frames}
Grid:     ${cols}x${rows} (${cols * rows} cells)
Size:     ${frameW}x${frameH} per frame
Sheet:    ${cols * frameW}x${rows * frameH} total
`);

// Check input exists
if (!existsSync(inputVideo)) {
  console.error(`Error: Input file not found: ${inputVideo}`);
  process.exit(1);
}

// Create temp directory
console.log('Creating temp directory...');
mkdirSync(tempDir, { recursive: true });

try {
  // Step 1: Extract frames
  console.log(`Extracting ${frames} frames...`);
  const extractCmd = `ffmpeg -i "${inputVideo}" -vf "scale=${frameW}:${frameH}:force_original_aspect_ratio=decrease,pad=${frameW}:${frameH}:(ow-iw)/2:(oh-ih)/2:color=black@0" -frames:v ${frames} "${join(tempDir, 'frame_%03d.png')}" -y`;
  
  execSync(extractCmd, { stdio: 'pipe' });
  console.log(`  ✓ Extracted ${frames} frames to temp directory`);

  // Step 2: Create spritesheet
  console.log('Tiling into spritesheet...');
  const tileCmd = `ffmpeg -i "${join(tempDir, 'frame_%03d.png')}" -vf "tile=${cols}x${rows}" "${output}" -y`;
  
  execSync(tileCmd, { stdio: 'pipe' });
  console.log(`  ✓ Created spritesheet: ${output}`);

  console.log(`
╔════════════════════════════════════════╗
║              Success!                  ║
╚════════════════════════════════════════╝

Spritesheet saved to: ${output}

To use in your code:
  frameWidth: ${frameW}
  frameHeight: ${frameH}
  columns: ${cols}
  rows: ${rows}
  frameCount: ${frames}
`);

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} finally {
  // Cleanup temp directory
  console.log('Cleaning up temp files...');
  rmSync(tempDir, { recursive: true, force: true });
}
