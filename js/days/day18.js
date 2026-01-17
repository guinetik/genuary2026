/**
 * Genuary 2026 - Day 18
 * Prompt: "Unexpected path"
 *
 * LANGTON'S ANT - YIN & YANG
 *
 * Two ants on two planes of existence (blend modes):
 * 1. The Light (Screen blend)
 * 2. The Shadow (Exclusion blend)
 *
 * They move in symmetry but their worlds interact in unexpected ways
 * when they cross paths, creating complex interference patterns.
 */

import { Game } from '@guinetik/gcanvas';

const CONFIG = {
  // Grid
  cellSize: 3,

  // Ant speed
  stepsPerFrame: 80,

  // Trail length
  trailLength: 300,

  // Color cycling
  hueSpeed: 30,        // Degrees per second
  saturation: 100,
  lightness: 45,

  // Particles
  particlesPerFlip: 2,
  particleLife: 0.8,
  particleSpeed: 100,
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

    // Each ant gets its own random hue - totally independent
    const hue1 = Math.random() * 360;
    const hue2 = Math.random() * 360;

    // === ANT 1: SCREEN (additive) ===
    this.grid1 = new Array(this.cols * this.rows).fill(false);
    this.ant1 = {
      x: Math.floor(this.cols / 3),
      y: Math.floor(this.rows / 2),
      dir: 0,
      hue: hue1,
      baseHue: hue1,
      trail: [],
    };

    // === ANT 2: EXCLUSION (psychedelic inversions) ===
    this.grid2 = new Array(this.cols * this.rows).fill(false);
    this.ant2 = {
      x: Math.floor(this.cols * 2 / 3),
      y: Math.floor(this.rows / 2),
      dir: 2,
      hue: hue2,
      baseHue: hue2,
      trail: [],
    };

    this.stepCount = 0;
    this.time = 0;

    // Particles
    this.particles = [];

    // Create offscreen canvas for ant 1 (screen blend - cyan/green)
    this.gridCanvas1 = document.createElement('canvas');
    this.gridCanvas1.width = this.cols * CONFIG.cellSize;
    this.gridCanvas1.height = this.rows * CONFIG.cellSize;
    this.gridCtx1 = this.gridCanvas1.getContext('2d');
    this.gridCtx1.fillStyle = '#000';
    this.gridCtx1.fillRect(0, 0, this.gridCanvas1.width, this.gridCanvas1.height);

    // Create offscreen canvas for ant 2 (exclusion blend - magenta/pink)
    this.gridCanvas2 = document.createElement('canvas');
    this.gridCanvas2.width = this.cols * CONFIG.cellSize;
    this.gridCanvas2.height = this.rows * CONFIG.cellSize;
    this.gridCtx2 = this.gridCanvas2.getContext('2d');
    this.gridCtx2.fillStyle = '#000';
    this.gridCtx2.fillRect(0, 0, this.gridCanvas2.width, this.gridCanvas2.height);
  }

  /**
   * Step a single ant
   */
  stepAnt(ant, grid, gridCtx, isLight) {
    const idx = ant.y * this.cols + ant.x;
    const isDark = grid[idx];

    // Add to trail
    ant.trail.push({ x: ant.x, y: ant.y, hue: ant.hue });
    if (ant.trail.length > CONFIG.trailLength) {
      ant.trail.shift();
    }

    // THE ONE SIMPLE RULE:
    if (isDark) {
      ant.dir = (ant.dir + 3) % 4; // Turn LEFT
    } else {
      ant.dir = (ant.dir + 1) % 4; // Turn RIGHT
    }

    // Flip the cell
    grid[idx] = !isDark;

    // Update grid canvas - bright psychedelic colors
    const lightness = grid[idx] ? CONFIG.lightness : 3;
    gridCtx.fillStyle = `hsl(${ant.hue}, ${CONFIG.saturation}%, ${lightness}%)`;
    gridCtx.fillRect(
      ant.x * CONFIG.cellSize,
      ant.y * CONFIG.cellSize,
      CONFIG.cellSize,
      CONFIG.cellSize
    );

    // Spawn particles
    const screenX = ant.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const screenY = ant.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    if (Math.random() < 0.3) { // Less particles for perf
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * CONFIG.particleSpeed * (0.5 + Math.random()),
        vy: Math.sin(angle) * CONFIG.particleSpeed * (0.5 + Math.random()),
        life: CONFIG.particleLife,
        maxLife: CONFIG.particleLife,
        hue: ant.hue,
        isLight,
      });
    }

    // Move forward
    ant.x += DX[ant.dir];
    ant.y += DY[ant.dir];

    // Wrap around edges
    if (ant.x < 0) ant.x = this.cols - 1;
    if (ant.x >= this.cols) ant.x = 0;
    if (ant.y < 0) ant.y = this.rows - 1;
    if (ant.y >= this.rows) ant.y = 0;
  }

  step() {
    // Step both ants
    this.stepAnt(this.ant1, this.grid1, this.gridCtx1, true);
    this.stepAnt(this.ant2, this.grid2, this.gridCtx2, false);
    
    this.stepCount++;
  }

  update(dt) {
    super.update(dt);
    this.time += dt;

    // Each ant cycles its own hue independently
    this.ant1.hue = (this.ant1.baseHue + this.time * CONFIG.hueSpeed) % 360;
    this.ant2.hue = (this.ant2.baseHue + this.time * CONFIG.hueSpeed) % 360;

    // Trim trails
    while (this.ant1.trail.length > CONFIG.trailLength) this.ant1.trail.shift();
    while (this.ant2.trail.length > CONFIG.trailLength) this.ant2.trail.shift();

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

    // Motion blur fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);

    const offsetX = (w - this.gridCanvas1.width) / 2;
    const offsetY = (h - this.gridCanvas1.height) / 2;

    // === Define Render Helpers ===
    const renderTrail = (ant) => {
      ctx.save();
      // Use source-over to draw the path "on top" of the background
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw the line
      if (ant.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(
          offsetX + ant.trail[0].x * CONFIG.cellSize + CONFIG.cellSize / 2,
          offsetY + ant.trail[0].y * CONFIG.cellSize + CONFIG.cellSize / 2
        );
        for (let i = 1; i < ant.trail.length; i++) {
            ctx.lineTo(
                offsetX + ant.trail[i].x * CONFIG.cellSize + CONFIG.cellSize / 2,
                offsetY + ant.trail[i].y * CONFIG.cellSize + CONFIG.cellSize / 2
            );
        }
        
        // Gradient stroke
        const gradient = ctx.createLinearGradient(
            offsetX + ant.trail[0].x * CONFIG.cellSize, 
            offsetY + ant.trail[0].y * CONFIG.cellSize,
            offsetX + ant.trail[ant.trail.length-1].x * CONFIG.cellSize,
            offsetY + ant.trail[ant.trail.length-1].y * CONFIG.cellSize
        );
        gradient.addColorStop(0, `hsla(${ant.trail[0].hue}, 100%, 50%, 0)`);
        gradient.addColorStop(1, `hsla(${ant.hue}, 100%, 70%, 1)`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = CONFIG.cellSize * 0.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      ctx.restore();
    };

    const glowSize = CONFIG.cellSize * 25; // Increased glow
    const renderGlow = (ant, curX, curY) => {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      
      // COMET TAIL: Draw fading glow circles along recent history
      const cometLength = 25; // How many steps back the glow extends
      const trail = ant.trail;
      
      for (let i = 0; i < Math.min(trail.length, cometLength); i++) {
        // Access from end of trail (most recent)
        const t = trail[trail.length - 1 - i];
        
        // Calculate decay
        const progress = 1 - (i / cometLength); // 1.0 at head, 0.0 at tail
        const size = glowSize * (0.4 + 0.6 * progress); // Shrink slightly
        const alpha = progress * 0.3; // Fade out

        const tX = offsetX + t.x * CONFIG.cellSize + CONFIG.cellSize / 2;
        const tY = offsetY + t.y * CONFIG.cellSize + CONFIG.cellSize / 2;

        const grad = ctx.createRadialGradient(tX, tY, 0, tX, tY, size);
        // Reduced lightness from 70% to 55% to keep trail colorful, not white
        grad.addColorStop(0, `hsla(${t.hue}, ${CONFIG.saturation}%, 55%, ${alpha})`);
        grad.addColorStop(1, `hsla(${t.hue}, ${CONFIG.saturation}%, 50%, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tX, tY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // COMET HEAD: Bright core at current position
      const headHue = ant.hue;
      
      // Core
      const grad = ctx.createRadialGradient(curX, curY, 0, curX, curY, glowSize);
      // Start with color (60% lightness) instead of near-white (80-90%)
      // This prevents the "solid white ball" look
      grad.addColorStop(0, `hsla(${headHue}, 100%, 60%, 0.6)`); 
      grad.addColorStop(0.4, `hsla(${headHue}, 100%, 50%, 0.2)`);
      grad.addColorStop(1, `hsla(${headHue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(curX, curY, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Outer Bloom
      const bloomSize = glowSize * 1.5;
      const grad2 = ctx.createRadialGradient(curX, curY, 0, curX, curY, bloomSize);
      grad2.addColorStop(0, `hsla(${headHue}, 100%, 50%, 0.1)`);
      grad2.addColorStop(1, `hsla(${headHue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(curX, curY, bloomSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawBody = (x, y, hue) => {
      ctx.save();
      // Drop shadow to separate from background
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      
      ctx.beginPath();
      ctx.arc(x, y, CONFIG.cellSize * 1.5, 0, Math.PI * 2);
      // Tint the body to match the ant's hue
      ctx.fillStyle = `hsl(${hue}, ${CONFIG.saturation}%, 90%)`;
      ctx.fill();
      
      // Ring
      ctx.beginPath();
      ctx.arc(x, y, CONFIG.cellSize * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    // === LAYER 1: Screen blend (The Light) ===
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(this.gridCanvas1, offsetX, offsetY);

    // === LAYER 2: Exclusion blend (The Shadow) ===
    ctx.globalCompositeOperation = 'exclusion';
    ctx.drawImage(this.gridCanvas2, offsetX, offsetY);

    // === ENTITIES (On Top) ===
    // We draw trails and glows AFTER the grids so they float above the chaos
    
    // Ant 1
    const ant1X = offsetX + this.ant1.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const ant1Y = offsetY + this.ant1.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    renderTrail(this.ant1);
    renderGlow(this.ant1, ant1X, ant1Y);

    // Ant 2
    const ant2X = offsetX + this.ant2.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const ant2Y = offsetY + this.ant2.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    renderTrail(this.ant2);
    renderGlow(this.ant2, ant2X, ant2Y);

    // === Particles ===
    // Draw particles BEFORE the glow to have them immersed, OR keep after.
    // Let's try lighter blend for particles to make them sparkle
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const alpha = (p.life / p.maxLife);
      const size = 6 * (p.life / p.maxLife);

      ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(offsetX + p.x, offsetY + p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset blend mode
    ctx.globalCompositeOperation = 'source-over';

    // Ant bodies (white cores)
    ctx.fillStyle = '#fff';
    drawBody(ant1X, ant1Y, this.ant1.hue);
    drawBody(ant2X, ant2Y, this.ant2.hue);
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
