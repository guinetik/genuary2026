/**
 * Day 25 Lightning Effect
 * @fileoverview Screen-space lightning bolt effect for Primordial Soup demo
 */

import { GameObject } from '@guinetik/gcanvas';

/**
 * Lightning - Screen-space lightning effect
 * Renders independently of camera rotation (like vents)
 * @extends GameObject
 */
export class Lightning extends GameObject {
  constructor(game, options = {}) {
    super(game, options);

    this.width = game.width;
    this.height = game.height;

    // Lightning state
    this.flash = null;  // { x, y, intensity, bolts }
    this.timer = options.interval || 4;
    this.interval = options.interval || 4;
    this.variance = options.variance || 2;

    // Config
    this.radius = options.radius || 150;
    this.energy = options.energy || 0.4;

    // Callback for heating molecules
    this.onStrike = options.onStrike || null;

    // z-index to render on top
    this.zIndex = options.zIndex || 100;
  }

  /**
   * Generate a branching lightning bolt path in SCREEN space
   * @param {number} startX - Start X (screen coords)
   * @param {number} startY - Start Y (screen coords)
   * @param {number} endX - End X (screen coords)
   * @param {number} endY - End Y (screen coords)
   * @param {number} depth - Recursion depth for branches
   * @returns {Array} Array of line segments [{x1,y1,x2,y2,width}]
   */
  generateBolt(startX, startY, endX, endY, depth = 0) {
    const segments = [];
    const maxDepth = 3;
    const segmentCount = depth === 0 ? 8 + Math.floor(Math.random() * 5) : 4 + Math.floor(Math.random() * 3);

    let x = startX, y = startY;
    const dx = (endX - startX) / segmentCount;
    const dy = (endY - startY) / segmentCount;

    // Jaggedness decreases with depth
    const jitter = depth === 0 ? 40 : 20;
    const baseWidth = depth === 0 ? 3 : 1.5;

    for (let i = 0; i < segmentCount; i++) {
      let nextX = startX + dx * (i + 1);
      let nextY = startY + dy * (i + 1);

      // Add randomness except for last segment
      if (i < segmentCount - 1) {
        nextX += (Math.random() - 0.5) * jitter;
        nextY += (Math.random() - 0.5) * jitter * 0.3;
      }

      // Width tapers toward end
      const progress = i / segmentCount;
      const width = baseWidth * (1 - progress * 0.5);

      segments.push({ x1: x, y1: y, x2: nextX, y2: nextY, width });

      // Branch with decreasing probability
      if (depth < maxDepth && Math.random() < 0.3 - depth * 0.1) {
        const branchLength = 30 + Math.random() * 50;
        const branchAngle = (Math.random() - 0.5) * Math.PI * 0.5;
        const branchEndX = nextX + Math.cos(branchAngle + Math.PI / 2) * branchLength * (Math.random() < 0.5 ? 1 : -1);
        const branchEndY = nextY + branchLength * 0.7;

        const branchSegments = this.generateBolt(nextX, nextY, branchEndX, branchEndY, depth + 1);
        segments.push(...branchSegments);
      }

      x = nextX;
      y = nextY;
    }

    return segments;
  }

  /**
   * Trigger a lightning strike
   * @param {number} screenX - Strike X position (screen coords, optional)
   * @param {number} screenY - Strike Y position (screen coords, optional)
   */
  strike(screenX, screenY) {
    // Default to random position in upper-middle area
    const x = screenX ?? this.width * (0.2 + Math.random() * 0.6);
    const y = screenY ?? this.height * (0.3 + Math.random() * 0.3);

    // Generate bolt from top of screen to strike point
    const startX = x + (Math.random() - 0.5) * 80;
    const startY = -20;
    const bolts = this.generateBolt(startX, startY, x, y);

    this.flash = { x, y, intensity: 1, bolts };

    // Notify callback for heating molecules
    if (this.onStrike) {
      this.onStrike(x, y, this.radius, this.energy);
    }
  }

  /**
   * Update lightning state
   * @param {number} dt - Delta time
   */
  update(dt) {
    super.update(dt);

    // Timer for automatic strikes
    this.timer -= dt;
    if (this.timer <= 0) {
      this.strike();
      this.timer = this.interval + (Math.random() - 0.5) * this.variance * 2;
    }

    // Decay flash
    if (this.flash) {
      this.flash.intensity -= dt * 3;
      if (this.flash.intensity <= 0) {
        this.flash = null;
      }
    }
  }

  /**
   * Render lightning in screen space (not affected by camera)
   */
  render() {
    if (!this.flash || !this.visible) return;

    const ctx = this.game.ctx;
    const alpha = this.flash.intensity;

    // Draw lightning bolt segments
    if (this.flash.bolts && alpha > 0.1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';

      // Outer glow layer (wide, dim)
      for (const seg of this.flash.bolts) {
        ctx.strokeStyle = `rgba(100, 150, 255, ${alpha * 0.3})`;
        ctx.lineWidth = seg.width * 6;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }

      // Middle glow layer
      for (const seg of this.flash.bolts) {
        ctx.strokeStyle = `rgba(180, 200, 255, ${alpha * 0.6})`;
        ctx.lineWidth = seg.width * 3;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }

      // Core (bright white)
      for (const seg of this.flash.bolts) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = seg.width;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    // Radial flash at strike point
    if (alpha > 0.1) {
      ctx.save();
      const flashRadius = 200 * alpha;
      const flashGrad = ctx.createRadialGradient(
        this.flash.x, this.flash.y, 0,
        this.flash.x, this.flash.y, flashRadius
      );
      flashGrad.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.8})`);
      flashGrad.addColorStop(0.3, `rgba(150, 180, 255, ${alpha * 0.4})`);
      flashGrad.addColorStop(1, 'transparent');

      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(this.flash.x, this.flash.y, flashRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  }
}
