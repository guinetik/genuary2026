/**
 * Genuary 2026 - Day 18
 * Prompt: "Unexpected path"
 *
 * LANGTON'S ANT
 * One simple rule creates an unexpected path:
 *   - On light: turn RIGHT, darken cell, move forward
 *   - On dark: turn LEFT, lighten cell, move forward
 *
 * The ant creates chaos for ~10,000 steps, then suddenly
 * starts building a diagonal "highway" - truly unexpected!
 */

import { Game } from '@guinetik/gcanvas';

const CONFIG = {
  // Grid
  cellSize: 4,

  // Ant speed
  stepsPerFrame: 50,

  // Colors - cycle hue over time
  baseHue: 120,
  hueSpeed: 8,

  // Trail
  trailLength: 60,
  trailFade: 0.92,

  // Particles
  particlesPerFlip: 2,
  particleLife: 0.8,
  particleSpeed: 40,
};

// Directions: 0=up, 1=right, 2=down, 3=left
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

class LangtonAntDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();

    // Grid dimensions
    this.cols = Math.floor(this.width / CONFIG.cellSize);
    this.rows = Math.floor(this.height / CONFIG.cellSize);

    // Grid state (false = light, true = dark)
    this.grid = new Array(this.cols * this.rows).fill(false);

    // Ant state
    this.antX = Math.floor(this.cols / 2);
    this.antY = Math.floor(this.rows / 2);
    this.antDir = 0; // Facing up

    this.stepCount = 0;
    this.time = 0;
    this.hue = CONFIG.baseHue;

    // Trail history
    this.trail = [];

    // Particles
    this.particles = [];

    // Create offscreen canvas for grid
    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.width = this.cols * CONFIG.cellSize;
    this.gridCanvas.height = this.rows * CONFIG.cellSize;
    this.gridCtx = this.gridCanvas.getContext('2d');

    // Initialize grid canvas with dark background
    this.gridCtx.fillStyle = `hsl(${this.hue}, 80%, 5%)`;
    this.gridCtx.fillRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
  }

  step() {
    const idx = this.antY * this.cols + this.antX;
    const isDark = this.grid[idx];

    // Add to trail
    this.trail.push({ x: this.antX, y: this.antY, hue: this.hue });
    if (this.trail.length > CONFIG.trailLength) {
      this.trail.shift();
    }

    // THE ONE SIMPLE RULE:
    if (isDark) {
      // On dark: turn LEFT
      this.antDir = (this.antDir + 3) % 4;
    } else {
      // On light: turn RIGHT
      this.antDir = (this.antDir + 1) % 4;
    }

    // Flip the cell
    this.grid[idx] = !isDark;

    // Update grid canvas with hue-based colors
    const lightness = this.grid[idx] ? 45 : 8;
    this.gridCtx.fillStyle = `hsl(${this.hue}, 100%, ${lightness}%)`;
    this.gridCtx.fillRect(
      this.antX * CONFIG.cellSize,
      this.antY * CONFIG.cellSize,
      CONFIG.cellSize,
      CONFIG.cellSize
    );

    // Spawn particles on flip
    const screenX = this.antX * CONFIG.cellSize + CONFIG.cellSize / 2;
    const screenY = this.antY * CONFIG.cellSize + CONFIG.cellSize / 2;
    for (let i = 0; i < CONFIG.particlesPerFlip; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * CONFIG.particleSpeed * (0.5 + Math.random()),
        vy: Math.sin(angle) * CONFIG.particleSpeed * (0.5 + Math.random()),
        life: CONFIG.particleLife,
        maxLife: CONFIG.particleLife,
        hue: this.hue,
      });
    }

    // Move forward
    this.antX += DX[this.antDir];
    this.antY += DY[this.antDir];

    // Wrap around edges
    if (this.antX < 0) this.antX = this.cols - 1;
    if (this.antX >= this.cols) this.antX = 0;
    if (this.antY < 0) this.antY = this.rows - 1;
    if (this.antY >= this.rows) this.antY = 0;

    this.stepCount++;
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Cycle hue
    this.hue = (CONFIG.baseHue + this.time * CONFIG.hueSpeed) % 360;

    // Run multiple steps per frame
    for (let i = 0; i < CONFIG.stepsPerFrame; i++) {
      this.step();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Cap particles
    if (this.particles.length > 500) {
      this.particles = this.particles.slice(-400);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear with slight fade for motion blur
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    const offsetX = (w - this.gridCanvas.width) / 2;
    const offsetY = (h - this.gridCanvas.height) / 2;

    ctx.drawImage(this.gridCanvas, offsetX, offsetY);

    // Draw trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.6;
      const size = CONFIG.cellSize * 0.4 * (i / this.trail.length);

      ctx.fillStyle = `hsla(${t.hue}, 100%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(
        offsetX + t.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        offsetY + t.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        size,
        0, Math.PI * 2
      );
      ctx.fill();
    }

    // Draw particles
    for (const p of this.particles) {
      const alpha = (p.life / p.maxLife) * 0.8;
      const size = 2 * (p.life / p.maxLife);

      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(offsetX + p.x, offsetY + p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ant with glow
    const antScreenX = offsetX + this.antX * CONFIG.cellSize + CONFIG.cellSize / 2;
    const antScreenY = offsetY + this.antY * CONFIG.cellSize + CONFIG.cellSize / 2;

    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;

    const gradient = ctx.createRadialGradient(
      antScreenX, antScreenY, 0,
      antScreenX, antScreenY, CONFIG.cellSize * 4
    );
    gradient.addColorStop(0, `hsla(${this.hue}, 100%, 90%, 1)`);
    gradient.addColorStop(0.2, `hsla(${this.hue}, 100%, 60%, 0.6)`);
    gradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(antScreenX, antScreenY, CONFIG.cellSize * 4, 0, Math.PI * 2);
    ctx.fill();

    // Ant body
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(antScreenX, antScreenY, CONFIG.cellSize * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Step counter
    ctx.font = '14px "Fira Code", monospace';
    ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, 0.8)`;
    ctx.textAlign = 'left';
    ctx.fillText(`LANGTON'S ANT`, 20, 30);
    ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, 0.6)`;
    ctx.fillText(`Steps: ${this.stepCount.toLocaleString()}`, 20, 50);
  }
}

/**
 * Create Day 18 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day18(canvas) {
  const game = new LangtonAntDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
