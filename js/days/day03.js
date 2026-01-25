/**
 * Genuary 2026 - Day 3
 * Prompt: "Fibonacci forever"
 * 
 * @fileoverview GOLDEN VORTEX - Phyllotaxis pattern visualization
 * 
 * A living, breathing phyllotaxis pattern. Seeds pulse, spiral, and react
 * to your mouse. The golden angle creates infinite spiraling beauty.
 * 
 * Move mouse to disturb. Click to explode.
 * 
 * Showcases: Painter utilities (shapes, colors, effects, gradients)
 * 
 * @author guinetik
 * @see {@link https://genuary.art|Genuary}
 * @see {@link https://gcanvas.guinetik.com|GCanvas Library}
 */

import { Game, Painter } from "@guinetik/gcanvas";

/**
 * Configuration object for Day 3
 * 
 * @type {Object}
 * @property {number} goldenAngle - Golden angle in degrees (137.507...)
 * @property {number} numSeeds - Total number of seeds in the pattern
 * @property {number} baseRadiusRatio - Base seed radius as ratio of min dimension
 * @property {number} spacingRatio - Spacing between seeds as ratio of min dimension
 * @property {number} pulseSpeed - Pulse animation speed
 * @property {number} rotationSpeed - Global rotation speed
 * @property {number} waveSpeed - Wave animation speed
 * @property {number} waveAmplitudeRatio - Wave amplitude as ratio of min dimension
 * @property {number} hueSpeed - Color hue rotation speed
 * @property {number} saturation - HSL saturation value
 * @property {number} mouseRadiusRatio - Mouse interaction radius as ratio of min dimension
 * @property {number} mouseForceRatio - Mouse force strength as ratio of min dimension
 * @property {number} explosionForceRatio - Explosion force as ratio of min dimension
 * @property {number} explosionDecay - Explosion velocity decay factor
 * @property {number} centerSizeRatio - Center glow size as ratio of min dimension
 */
const CONFIG = {
  goldenAngle: 137.5077640500378,
  numSeeds: 1000,
  baseRadiusRatio: 0.015, // Ratio of min dimension
  spacingRatio: 0.012, // Ratio of min dimension

  // Animation
  pulseSpeed: 1.5,
  rotationSpeed: 0.15,
  waveSpeed: 2,
  waveAmplitudeRatio: 0.03, // Ratio of min dimension

  // Colors - full spectrum
  hueSpeed: 30,
  saturation: 85,

  // Mouse interaction
  mouseRadiusRatio: 0.25, // Ratio of min dimension
  mouseForceRatio: 0.15, // Ratio of min dimension

  // Explosion
  explosionForceRatio: 0.5, // Ratio of min dimension
  explosionDecay: 0.96,

  // Center glow
  centerSizeRatio: 0.04, // Ratio of min dimension
};

const TAU = Math.PI * 2;
const GOLDEN_ANGLE_RAD = (CONFIG.goldenAngle * Math.PI) / 180;

/**
 * Golden Vortex Demo
 * 
 * Main game class for Day 3, creating a phyllotaxis pattern using the
 * golden angle. Features pulsing seeds, mouse interaction, and explosion effects.
 * 
 * @class GoldenVortexDemo
 * @extends {Game}
 */
class GoldenVortexDemo extends Game {
  /**
   * Create the demo
   * 
   * @param {HTMLCanvasElement} canvas - Target canvas element
   */
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = "#000";
  }

  /**
   * Initialize the demo
   */
  init() {
    super.init();
    Painter.init(this.ctx);

    this.time = 0;
    this.hueOffset = 0;
    this.globalRotation = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.exploding = false;
    this.explosionTime = 0;

    // Generate seeds with normalized values (will be scaled by canvas size)
    const minDim = Math.min(this.width, this.height);
    const spacing = minDim * CONFIG.spacingRatio;

    this.seeds = [];
    for (let i = 0; i < CONFIG.numSeeds; i++) {
      const angle = i * GOLDEN_ANGLE_RAD;
      // Store normalized radius factor (sqrt pattern for phyllotaxis)
      const radiusFactor = Math.sqrt(i);

      this.seeds.push({
        index: i,
        baseAngle: angle,
        radiusFactor: radiusFactor, // Normalized, will be multiplied by spacing
        angle: angle,
        radius: radiusFactor * spacing, // Initialize with proper value
        vx: 0,
        vy: 0,
        sizeFactor: Math.max(0.3, 1 - i * 0.0005), // Normalized size factor
        phase: Math.random() * TAU,
      });
    }

    // Mouse tracking
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left - this.width / 2;
      this.mouseY = e.clientY - rect.top - this.height / 2;
    });

    this.canvas.addEventListener("click", () => {
      this.explode();
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.mouseX = 0;
      this.mouseY = 0;
    });

    // Touch support for mobile
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = touch.clientX - rect.left - this.width / 2;
      this.mouseY = touch.clientY - rect.top - this.height / 2;
    }, { passive: false });

    this.canvas.addEventListener("touchend", (e) => {
      this.explode();
      // Reset mouse position after touch
      this.mouseX = 0;
      this.mouseY = 0;
    });
  }

  /**
   * Trigger explosion effect
   */
  explode() {
    this.exploding = true;
    this.explosionTime = this.time;

    const minDim = Math.min(this.width, this.height);
    const explosionForce = minDim * CONFIG.explosionForceRatio;
    const spacing = minDim * CONFIG.spacingRatio;

    for (const seed of this.seeds) {
      const baseRadius = seed.radiusFactor * spacing;
      const x = Math.cos(seed.angle) * baseRadius;
      const y = Math.sin(seed.angle) * baseRadius;
      const dist = Math.sqrt(x * x + y * y) + 1;

      // Explosion velocity - outward from center (scaled to canvas)
      const force = explosionForce / Math.sqrt(dist + 50);
      const randomScale = minDim * 0.06;
      seed.vx = (x / dist) * force + (Math.random() - 0.5) * randomScale;
      seed.vy = (y / dist) * force + (Math.random() - 0.5) * randomScale;
    }
  }

  /**
   * Update game state
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    super.update(dt);

    this.time += dt;
    this.hueOffset += CONFIG.hueSpeed * dt;
    this.globalRotation += CONFIG.rotationSpeed * dt;

    // Calculate scaled values based on canvas size
    const minDim = Math.min(this.width, this.height);
    const spacing = minDim * CONFIG.spacingRatio;
    const waveAmplitude = minDim * CONFIG.waveAmplitudeRatio;
    const mouseRadius = minDim * CONFIG.mouseRadiusRatio;
    const mouseForce = minDim * CONFIG.mouseForceRatio;

    for (const seed of this.seeds) {
      // Base radius for this seed (scaled to canvas)
      const baseRadius = seed.radiusFactor * spacing;

      // Current position
      let x = Math.cos(seed.angle) * seed.radius;
      let y = Math.sin(seed.angle) * seed.radius;

      if (this.exploding) {
        // Apply explosion velocity
        x += seed.vx * dt;
        y += seed.vy * dt;

        // Decay velocity
        seed.vx *= CONFIG.explosionDecay;
        seed.vy *= CONFIG.explosionDecay;

        // Spring back to original position
        const targetX =
          Math.cos(seed.baseAngle + this.globalRotation) * baseRadius;
        const targetY =
          Math.sin(seed.baseAngle + this.globalRotation) * baseRadius;

        const dx = targetX - x;
        const dy = targetY - y;

        seed.vx += dx * 2 * dt;
        seed.vy += dy * 2 * dt;

        // Update angle/radius from position
        seed.angle = Math.atan2(y + seed.vy * dt, x + seed.vx * dt);
        seed.radius = Math.sqrt(
          (x + seed.vx * dt) ** 2 + (y + seed.vy * dt) ** 2
        );

        // Check if explosion is over
        if (this.time - this.explosionTime > 3) {
          this.exploding = false;
        }
      } else {
        // Normal animation
        // Rotate everything
        seed.angle = seed.baseAngle + this.globalRotation;

        // Pulsing radius
        const pulse =
          Math.sin(this.time * CONFIG.pulseSpeed + seed.index * 0.02) * 0.1 + 1;

        // Spiral wave (scaled)
        const wave =
          Math.sin(this.time * CONFIG.waveSpeed - baseRadius * 0.05) *
          waveAmplitude;

        seed.radius = baseRadius * pulse + (wave * baseRadius) / (minDim * 0.25);

        // Mouse interaction
        const dist = Math.sqrt(
          (x - this.mouseX) ** 2 + (y - this.mouseY) ** 2
        );
        if (dist < mouseRadius) {
          const force = (mouseRadius - dist) / mouseRadius;
          seed.radius += force * mouseForce * (1 - seed.index / CONFIG.numSeeds);
          seed.angle += force * 0.3 * Math.sin(this.time * 5);
        }
      }
    }
  }

  /**
   * Render the scene
   */
  render() {
    // Fade trail effect using Painter
    Painter.shapes.rect(0, 0, this.width, this.height, "rgba(0, 0, 0, 0.15)");

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Draw connecting lines (subtle)
    this.drawConnections(cx, cy);

    // Draw seeds
    this.drawSeeds(cx, cy);

    // Draw center glow
    this.drawCenter(cx, cy);
  }

  /**
   * Draw subtle spiral connections between seeds
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   */
  drawConnections(cx, cy) {
    // Connect seeds in Fibonacci spiral pattern
    this.ctx.beginPath();
    for (let i = 1; i < Math.min(500, this.seeds.length); i++) {
      const seed = this.seeds[i];
      const prev = this.seeds[i - 1];

      const x1 = cx + Math.cos(prev.angle) * prev.radius;
      const y1 = cy + Math.sin(prev.angle) * prev.radius;
      const x2 = cx + Math.cos(seed.angle) * seed.radius;
      const y2 = cy + Math.sin(seed.angle) * seed.radius;

      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
    }
    // stroke() sets styles AND strokes the current path
    Painter.colors.stroke(`hsla(${this.hueOffset % 360}, 70%, 50%, 0.05)`, 0.5);
  }

  /**
   * Draw all seed particles with glowing effect
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   */
  drawSeeds(cx, cy) {
    const minDim = Math.min(this.width, this.height);
    const baseSize = minDim * CONFIG.baseRadiusRatio;

    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const seed = this.seeds[i];
      const x = cx + Math.cos(seed.angle) * seed.radius;
      const y = cy + Math.sin(seed.angle) * seed.radius;

      // Color based on position in sequence + time
      const hue = (seed.index * 0.5 + this.hueOffset) % 360;
      const lightness = 50 + Math.sin(this.time * 3 + seed.phase) * 15;

      // Pulsing size (scaled to canvas)
      const pulse = Math.sin(this.time * 4 + seed.index * 0.1) * 0.3 + 1;
      const size = baseSize * seed.sizeFactor * pulse;

      // Skip if size is invalid (prevents gradient error)
      if (!isFinite(size) || size <= 0 || !isFinite(x) || !isFinite(y)) continue;

      // Draw glow using Painter utilities
      Painter.effects.setBlendMode("lighter");

      // Create radial gradient for glow (x0, y0, r0, x1, y1, r1, stops)
      const gradient = Painter.colors.radialGradient(x, y, 0, x, y, size * 2, [
        {
          offset: 0,
          color: `hsla(${hue}, ${CONFIG.saturation}%, ${lightness}%, 0.9)`,
        },
        {
          offset: 0.5,
          color: `hsla(${hue}, ${CONFIG.saturation}%, ${lightness - 10}%, 0.4)`,
        },
        {
          offset: 1,
          color: `hsla(${hue}, ${CONFIG.saturation}%, ${lightness - 20}%, 0)`,
        },
      ]);

      // Pass gradient directly as color to fillCircle
      Painter.shapes.fillCircle(x, y, size * 2, gradient);

      // Core - bright center
      Painter.effects.setBlendMode("source-over");
      Painter.shapes.fillCircle(
        x,
        y,
        size * 0.5,
        `hsl(${hue}, ${CONFIG.saturation}%, ${lightness + 20}%)`
      );
    }
  }

  /**
   * Draw glowing center orb
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   */
  drawCenter(cx, cy) {
    Painter.effects.setBlendMode("lighter");

    // Pulsing center (scaled to canvas)
    const minDim = Math.min(this.width, this.height);
    const pulse = Math.sin(this.time * 2) * 0.3 + 1;
    const centerSize = minDim * CONFIG.centerSizeRatio * pulse;

    // Create radial gradient for center glow (x0, y0, r0, x1, y1, r1, stops)
    const gradient = Painter.colors.radialGradient(cx, cy, 0, cx, cy, centerSize, [
      { offset: 0, color: `hsla(${this.hueOffset % 360}, 100%, 80%, 0.8)` },
      {
        offset: 0.3,
        color: `hsla(${(this.hueOffset + 30) % 360}, 90%, 60%, 0.4)`,
      },
      { offset: 1, color: "transparent" },
    ]);

    // Pass gradient directly as color to fillCircle
    Painter.shapes.fillCircle(cx, cy, centerSize, gradient);

    Painter.effects.setBlendMode("source-over");
  }
}

/**
 * Create Day 3 visualization
 * 
 * Factory function that creates and starts the Golden Vortex demo.
 * Returns a control object with stop() method for lifecycle management.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} Control object with stop() method and game instance
 * @returns {Function} returns.stop - Function to stop the game
 * @returns {GoldenVortexDemo} returns.game - The game instance
 */
export default function day03(canvas) {
  const game = new GoldenVortexDemo(canvas);
  game.start();
  return { stop: () => game.stop(), game };
}
