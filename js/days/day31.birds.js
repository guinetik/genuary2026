/**
 * Day 31 Bird Flocks
 * 
 * @fileoverview Simplified boids implementation for bird flocks
 * 
 * Provides Bird and BirdFlock classes for rendering animated bird
 * formations that fly across the sky in the finale scene.
 * 
 * @module day31.birds
 * @author guinetik
 */

import { CONFIG } from './day31.config.js';

/**
 * A single bird in a flock using simplified boids behavior
 * 
 * @class Bird
 */
class Bird {
  /**
   * @param {number} x - Start X
   * @param {number} y - Start Y
   * @param {number} vx - Velocity X
   * @param {number} vy - Velocity Y
   */
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.angle = Math.atan2(vy, vx);
    this.wingPhase = Math.random() * Math.PI * 2;
  }

  /**
   * Update bird position and animation
   * @param {number} dt - Delta time
   * @param {Bird[]} flock - Other birds in flock for cohesion
   */
  update(dt, flock) {
    // Simple cohesion - drift toward flock center
    if (flock.length > 1) {
      let centerX = 0, centerY = 0;
      for (const b of flock) {
        centerX += b.x;
        centerY += b.y;
      }
      centerX /= flock.length;
      centerY /= flock.length;

      // Gentle pull toward center
      this.vx += (centerX - this.x) * 0.3 * dt;
      this.vy += (centerY - this.y) * 0.3 * dt;
    }

    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > CONFIG.birdSpeed * 1.3) {
      this.vx = (this.vx / speed) * CONFIG.birdSpeed;
      this.vy = (this.vy / speed) * CONFIG.birdSpeed;
    }

    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Smooth angle
    const targetAngle = Math.atan2(this.vy, this.vx);
    let diff = targetAngle - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += diff * 0.1;

    // Wing flap
    this.wingPhase += dt * 10;
  }

  /**
   * Render bird as simple V shape
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const size = CONFIG.birdSize;
    const wingFlap = Math.sin(this.wingPhase) * 0.4;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Terminal green bird silhouette
    ctx.strokeStyle = 'rgba(0, 200, 80, 0.8)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // V-shaped bird with flapping wings
    ctx.beginPath();
    ctx.moveTo(-size, -size * (0.5 + wingFlap));
    ctx.lineTo(0, 0);
    ctx.lineTo(-size, size * (0.5 + wingFlap));
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * A flock of birds flying across the screen
 * 
 * Manages multiple Bird instances with flocking behavior and
 * renders them as a cohesive group.
 * 
 * @class BirdFlock
 */
class BirdFlock {
  /**
   * @param {number} startX - Flock start X
   * @param {number} startY - Flock start Y
   * @param {number} targetX - Target direction X
   * @param {number} targetY - Target direction Y
   * @param {number} count - Number of birds
   */
  constructor(startX, startY, targetX, targetY, count) {
    this.birds = [];
    this.active = true;

    // Direction vector
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const vx = (dx / dist) * CONFIG.birdSpeed;
    const vy = (dy / dist) * CONFIG.birdSpeed;

    // Create birds in loose formation
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 30;
      const speedVar = 0.9 + Math.random() * 0.2;
      this.birds.push(new Bird(
        startX + offsetX,
        startY + offsetY,
        vx * speedVar,
        vy * speedVar
      ));
    }
  }

  /**
   * Update all birds
   * @param {number} dt
   * @param {number} w - Screen width
   * @param {number} h - Screen height
   */
  update(dt, w, h) {
    for (const bird of this.birds) {
      bird.update(dt, this.birds);
    }

    // Deactivate if all birds off screen
    const margin = 100;
    this.active = this.birds.some(b =>
      b.x > -margin && b.x < w + margin &&
      b.y > -margin && b.y < h + margin
    );
  }

  /**
   * Render all birds
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    for (const bird of this.birds) {
      bird.render(ctx);
    }
  }
}

export { BirdFlock };