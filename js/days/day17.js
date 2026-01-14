/**
 * Genuary 2026 - Day 17
 * Prompt: "Wallpaper group"
 *
 * INFINITE WALLPAPER
 * One of the 17 periodic wallpaper groups that tile the plane.
 * Features p6m (hexagonal) symmetry - the most symmetric of all groups.
 *
 * The pattern zooms infinitely while colors shift through the spectrum.
 * Each zoom level reveals the same pattern at a different scale -
 * the defining property of a true wallpaper group.
 */

import { Game } from '@guinetik/gcanvas';

const CONFIG = {
  // Zoom
  zoomSpeed: 0.3,
  zoomCycle: 2, // Zoom doubles every cycle

  // Pattern
  baseSize: 60,
  lineWidth: 2,

  // Colors
  hueSpeed: 15, // Degrees per second
  saturation: 100,
  lightness: 50,

  // Symmetry group to use
  // p6m = hexagonal with mirrors (most symmetric)
  group: 'p6m',
};

class WallpaperGroupDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();
    this.time = 0;
    this.hue = 120; // Start green

    // Mouse panning
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      // Offset based on mouse distance from center
      const cx = this.width / 2;
      const cy = this.height / 2;
      this.targetOffsetX = (this.mouseX - cx) * 0.3;
      this.targetOffsetY = (this.mouseY - cy) * 0.3;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.targetOffsetX = 0;
      this.targetOffsetY = 0;
    });

    // Click to shift colors
    this.canvas.addEventListener('click', () => {
      this.hue = (this.hue + 60) % 360; // Shift by 60 degrees
    });
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.hue = (this.hue + CONFIG.hueSpeed * dt) % 360;

    // Smooth pan towards target
    const ease = 1 - Math.pow(0.05, dt);
    this.offsetX += (this.targetOffsetX - this.offsetX) * ease;
    this.offsetY += (this.targetOffsetY - this.offsetY) * ease;
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2 + this.offsetX;
    const cy = h / 2 + this.offsetY;

    // Clear fully for clean render
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Infinite zoom: we cycle through zoom levels 1x to 2x, then reset to 1x
    // But we draw TWO layers that crossfade:
    // - Layer A: current zoom level (1x to 2x), fading OUT as it grows
    // - Layer B: next zoom level (0.5x to 1x), fading IN as it grows
    // When A reaches 2x and B reaches 1x, we've seamlessly looped

    const cycleTime = 1 / CONFIG.zoomSpeed; // Time for one full cycle
    const t = (this.time % cycleTime) / cycleTime; // 0 to 1 progress

    // Layer A: zooms from 1x to 2x, alpha from 1 to 0
    const zoomA = 1 + t; // 1 to 2
    const alphaA = 1 - t; // 1 to 0

    // Layer B: zooms from 0.5x to 1x, alpha from 0 to 1
    const zoomB = 0.5 + t * 0.5; // 0.5 to 1
    const alphaB = t; // 0 to 1

    // Draw layer B first (behind), then layer A (front)
    // Use different hue offsets for visual depth
    this.drawWallpaperGroup(ctx, cx, cy, zoomB, alphaB, 1);
    this.drawWallpaperGroup(ctx, cx, cy, zoomA, alphaA, 0);
  }

  drawWallpaperGroup(ctx, cx, cy, zoom, alpha, layer) {
    const baseSize = CONFIG.baseSize * zoom;

    // p6m: hexagonal lattice with 6-fold rotation and mirror symmetry
    // This is the symmetry of honeycombs and snowflakes

    // Hexagonal grid vectors
    const a1x = baseSize;
    const a1y = 0;
    const a2x = baseSize * Math.cos(Math.PI / 3);
    const a2y = baseSize * Math.sin(Math.PI / 3);

    // Calculate grid bounds
    const maxDist = Math.max(this.width, this.height) * 0.8;
    const gridRange = Math.ceil(maxDist / baseSize) + 2;

    // Hue offset per layer for depth effect
    const hueOffset = layer * 30;
    const hue = (this.hue + hueOffset) % 360;

    ctx.globalAlpha = alpha * 0.8;

    // Draw the hexagonal pattern
    for (let i = -gridRange; i <= gridRange; i++) {
      for (let j = -gridRange; j <= gridRange; j++) {
        // Lattice point
        const px = cx + i * a1x + j * a2x;
        const py = cy + i * a1y + j * a2y;

        // Skip if too far from center
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy > maxDist * maxDist) continue;

        // Draw hexagonal motif with p6m symmetry
        this.drawHexagonalMotif(ctx, px, py, baseSize * 0.4, hue);
      }
    }

    ctx.globalAlpha = 1;
  }

  drawHexagonalMotif(ctx, x, y, size, hue) {
    // p6m has 6-fold rotation + 6 mirror lines
    // Draw a motif that respects this symmetry

    const numSides = 6;

    // Outer hexagon
    ctx.strokeStyle = `hsla(${hue}, ${CONFIG.saturation}%, ${CONFIG.lightness}%, 0.8)`;
    ctx.lineWidth = CONFIG.lineWidth;
    ctx.beginPath();
    for (let i = 0; i < numSides; i++) {
      const angle = (i * Math.PI * 2) / numSides - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner star pattern (6-pointed)
    const innerSize = size * 0.5;
    const hue2 = (hue + 60) % 360;
    ctx.strokeStyle = `hsla(${hue2}, ${CONFIG.saturation}%, ${CONFIG.lightness + 10}%, 0.7)`;
    ctx.lineWidth = CONFIG.lineWidth * 0.7;
    ctx.beginPath();
    for (let i = 0; i < numSides * 2; i++) {
      const angle = (i * Math.PI) / numSides - Math.PI / 2;
      const r = i % 2 === 0 ? innerSize : innerSize * 0.4;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Connecting lines to neighbors (creates the lattice pattern)
    const hue3 = (hue + 120) % 360;
    ctx.strokeStyle = `hsla(${hue3}, ${CONFIG.saturation}%, ${CONFIG.lightness - 10}%, 0.4)`;
    ctx.lineWidth = CONFIG.lineWidth * 0.5;
    for (let i = 0; i < numSides; i++) {
      const angle = (i * Math.PI * 2) / numSides - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * size * 1.2, y + Math.sin(angle) * size * 1.2);
      ctx.stroke();
    }

    // Center dot
    const hue4 = (hue + 180) % 360;
    ctx.fillStyle = `hsla(${hue4}, ${CONFIG.saturation}%, ${CONFIG.lightness + 20}%, 0.9)`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Create Day 17 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day17(canvas) {
  const game = new WallpaperGroupDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
