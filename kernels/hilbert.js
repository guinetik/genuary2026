/**
 * Genuary 2026 - Day 18
 * Prompt: "Unexpected path"
 *
 * HILBERT FLOW
 * Particles flow endlessly along a Hilbert curve - a 1D path that fills 2D space.
 * The unexpected: watch how a simple recursive rule creates paths that visit
 * every point, with particles revealing the hidden structure.
 */

import { Game } from '@guinetik/gcanvas';

const CONFIG = {
  // Curve
  order: 5,  // 2^5 = 32x32 grid = 1024 points

  // Particles
  particleCount: 150,
  particleSpeed: 0.4,    // Fraction of curve per second
  particleSize: 3,
  trailLength: 80,

  // Colors
  hueSpeed: 20,
  saturation: 100,
  baseLightness: 55,

  // Curve visibility
  showCurve: true,
  curveAlpha: 0.15,
};

class HilbertFlowDemo extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#000';
  }

  init() {
    super.init();

    this.time = 0;
    this.hue = 120;
    this.points = [];
    this.particles = [];

    this.generateCurve();
    this.initParticles();
  }

  generateCurve() {
    this.points = [];
    const n = Math.pow(2, CONFIG.order);

    for (let i = 0; i < n * n; i++) {
      const pos = this.d2xy(n, i);
      this.points.push(pos);
    }
  }

  d2xy(n, d) {
    let x = 0, y = 0;
    let rx, ry, s, t = d;

    for (s = 1; s < n; s *= 2) {
      rx = 1 & (t / 2);
      ry = 1 & (t ^ rx);

      if (ry === 0) {
        if (rx === 1) {
          x = s - 1 - x;
          y = s - 1 - y;
        }
        [x, y] = [y, x];
      }

      x += s * rx;
      y += s * ry;
      t = Math.floor(t / 4);
    }

    return { x, y };
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      this.particles.push({
        pos: Math.random() * this.points.length,  // Position along curve
        speed: CONFIG.particleSpeed * (0.7 + Math.random() * 0.6),
        hueOffset: Math.random() * 60,
        size: CONFIG.particleSize * (0.6 + Math.random() * 0.8),
      });
    }
  }

  update(dt) {
    super.update(dt);
    this.time += dt;
    this.hue = (this.hue + CONFIG.hueSpeed * dt) % 360;

    // Move particles along curve
    for (const p of this.particles) {
      p.pos += p.speed * this.points.length * dt;
      // Wrap around
      if (p.pos >= this.points.length) {
        p.pos -= this.points.length;
      }
    }
  }

  getPointOnCurve(pos) {
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const p1 = this.points[idx % this.points.length];
    const p2 = this.points[(idx + 1) % this.points.length];

    return {
      x: p1.x + (p2.x - p1.x) * frac,
      y: p1.y + (p2.y - p1.y) * frac,
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Fade trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, w, h);

    const n = Math.pow(2, CONFIG.order);
    const padding = 30;
    const size = Math.min(w, h) - padding * 2;
    const cellSize = size / (n - 1);
    const offsetX = (w - size) / 2;
    const offsetY = (h - size) / 2;

    // Draw base curve (faint)
    if (CONFIG.showCurve) {
      ctx.strokeStyle = `hsla(${this.hue}, 50%, 30%, ${CONFIG.curveAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        const x = offsetX + p.x * cellSize;
        const y = offsetY + p.y * cellSize;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw particles with trails
    for (const particle of this.particles) {
      const hue = (this.hue + particle.hueOffset) % 360;

      // Draw trail
      ctx.lineCap = 'round';
      for (let t = 0; t < CONFIG.trailLength; t++) {
        const trailPos = particle.pos - t * 0.5;
        if (trailPos < 0) continue;

        const point = this.getPointOnCurve(trailPos);
        const x = offsetX + point.x * cellSize;
        const y = offsetY + point.y * cellSize;

        const alpha = 1 - (t / CONFIG.trailLength);
        const trailSize = particle.size * (1 - t / CONFIG.trailLength * 0.7);

        ctx.fillStyle = `hsla(${hue}, ${CONFIG.saturation}%, ${CONFIG.baseLightness}%, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw head (bright)
      const head = this.getPointOnCurve(particle.pos);
      const hx = offsetX + head.x * cellSize;
      const hy = offsetY + head.y * cellSize;

      // Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.fillStyle = `hsl(${hue}, 100%, 75%)`;
      ctx.beginPath();
      ctx.arc(hx, hy, particle.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

/**
 * Create Day 18 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day18(canvas) {
  const game = new HilbertFlowDemo(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game
  };
}
