/**
 * Genuary 2026 - Day 24
 * Prompt: "Perfectionist's nightmare"
 *
 * SPIROGRAPH NIGHTMARE
 * Using π (irrational) vs 3.14 (rational) to create spirograph patterns.
 * With 3.14: patterns eventually close - perfectionist's dream
 * With π: patterns NEVER close - perfectionist's nightmare
 *
 * Click to toggle between modes. Watch the difference!
 */

import { Game, Painter } from '@guinetik/gcanvas';

// Mode constants
const MODE = {
  IRRATIONAL: 0,      // π, fixed center - never closes
  RATIONAL: 1,        // 3.14 (actually 3.0), fixed center - closes
  CHAOS: 2,           // π + wandering center - ultimate nightmare
};

const CONFIG = {
  // Trail settings (optimized with offscreen baking)
  activePathLength: 150,    // Points kept in active (drawn every frame)
  bakeInterval: 60,         // Frames between baking to offscreen canvas
  fadeAlpha: 0.08,

  // Circle configurations (will be scaled)
  circles: [
    { outerR: 140, innerR: 50, traceR: 35, speed: 1.0 },
    { outerR: 100, innerR: 35, traceR: 25, speed: 0.7 },
    { outerR: 180, innerR: 60, traceR: 45, speed: 1.3 },
  ],

  // Trace angle multiplier (use integer for clean closure)
  traceAngleMultiplier: 2.0,

  // Rational value (3.0 closes quickly, 3.14 takes forever)
  rationalPi: 3.0,

  // Wandering center settings (for chaos mode)
  // Uses irrational frequency ratios so center never returns
  wanderRadiusRatio: 0.15,  // Ratio of canvas size
  wanderFreqX: Math.sqrt(2) * 0.3,  // Irrational frequency X
  wanderFreqY: Math.sqrt(3) * 0.25, // Irrational frequency Y (different irrational)

  // Color cycling speeds
  hueSpeed1: 10,
  hueSpeed2: 15,
  hueSpeed3: 8,
  hueOffsets: [0, 120, 240],

  // Animation
  timeStep: 0.015,

  // Glow layers for trails
  glowLayers: [20, 15, 10, 5],

  // Message timings
  rationalMessageStart: 20,
  rationalMessageEnd: 25,
  irrationalMessageStart: 50,
  irrationalMessageEnd: 55,
  chaosMessageStart: 30,
  chaosMessageEnd: 35,
};

/**
 * Spirograph circle data with path history
 */
class SpiroCircle {
  /**
   * @param {Object} config - Circle configuration
   * @param {number} scale - Scale factor based on canvas size
   * @param {number} hueOffset - Color hue offset
   */
  constructor(config, scale, hueOffset) {
    this.outerR = config.outerR * scale;
    this.innerR = config.innerR * scale;
    this.traceR = config.traceR * scale;
    this.speed = config.speed;
    this.hueOffset = hueOffset;
    this.path = [];
  }

  /**
   * Update circle position and add to path
   * @param {number} time - Current animation time
   * @param {number} piValue - Either Math.PI or 3.14
   * @param {number} centerX - Canvas center X
   * @param {number} centerY - Canvas center Y
   * @param {number} hue - Current hue value
   */
  update(time, piValue, centerX, centerY, hue) {
    const angle1 = time * this.speed;
    const angle2 = time * piValue * this.speed;

    // First circle center
    this.cx1 = centerX + this.outerR * Math.cos(angle1);
    this.cy1 = centerY + this.outerR * Math.sin(angle1);

    // Second circle center
    this.cx2 = this.cx1 + this.innerR * Math.cos(angle2);
    this.cy2 = this.cy1 + this.innerR * Math.sin(angle2);

    // Tracing point
    const traceAngle = angle2 * CONFIG.traceAngleMultiplier;
    this.px = this.cx2 + this.traceR * Math.cos(traceAngle);
    this.py = this.cy2 + this.traceR * Math.sin(traceAngle);

    // Current hue
    this.hue = (hue + this.hueOffset) % 360;

    // Store path point (limited to active length, older gets baked)
    this.path.push({ x: this.px, y: this.py, hue: this.hue });
  }

  /**
   * Get points to bake (older than activePathLength) and remove them
   * @returns {Array} Points to bake to offscreen canvas
   */
  extractPointsToBake() {
    if (this.path.length <= CONFIG.activePathLength) {
      return [];
    }
    // Extract all but the most recent activePathLength points
    const numToBake = this.path.length - CONFIG.activePathLength;
    return this.path.splice(0, numToBake);
  }

  /**
   * Clear path history
   */
  reset() {
    this.path = [];
  }
}

class PerfectionistNightmare extends Game {
  constructor(canvas) {
    super(canvas);
    this.backgroundColor = '#05000f';
  }

  init() {
    super.init();
    Painter.init(this.ctx);

    // State
    this.time = 0;
    this.mode = MODE.RATIONAL; // Start with 3.14 (rational)
    this.isAnimating = true;

    // Calculate scale based on canvas size
    this.scale = Math.min(this.width, this.height) / 600;

    // Create spirograph circles
    this.circles = CONFIG.circles.map(
      (config, i) => new SpiroCircle(config, this.scale, CONFIG.hueOffsets[i])
    );

    // Base center coordinates
    this.baseCenterX = this.width / 2;
    this.baseCenterY = this.height / 2;

    // Current center (may wander in chaos mode)
    this.centerX = this.baseCenterX;
    this.centerY = this.baseCenterY;

    // Wander radius
    this.wanderRadius = Math.min(this.width, this.height) * CONFIG.wanderRadiusRatio;

    // Offscreen canvas for baked trails (performance optimization)
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    this.clearOffscreen();

    // Bake counter
    this.frameCount = 0;

    // Click to toggle mode (only add once)
    if (!this._clickHandler) {
      this._clickHandler = () => this.toggleMode();
      this.canvas.addEventListener('click', this._clickHandler);
    }

    // Keyboard controls (only add once)
    if (!this._keyHandler) {
      this._keyHandler = (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          this.isAnimating = !this.isAnimating;
        } else if (e.code === 'KeyR') {
          this.reset();
        }
      };
      this.canvas.addEventListener('keydown', this._keyHandler);
    }

    // Make canvas focusable for keyboard
    this.canvas.tabIndex = 0;
    this.canvas.focus();
  }

  /**
   * Cycle through modes: π → 3.14 → chaos → π...
   */
  toggleMode() {
    this.mode = (this.mode + 1) % 3;
    this.reset();
  }

  /**
   * Reset animation state
   */
  reset() {
    this.time = 0;
    this.frameCount = 0;
    this.centerX = this.baseCenterX;
    this.centerY = this.baseCenterY;
    this.circles.forEach((c) => c.reset());
    
    // Clear main canvas thoroughly
    Painter.save();
    Painter.effects.clearShadow();
    Painter.effects.setBlendMode('source-over');
    Painter.shapes.rect(0, 0, this.canvas.width, this.canvas.height, this.backgroundColor);
    Painter.restore();
    
    // Recreate offscreen canvas entirely (guarantees clean state)
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    this.offscreenCtx.fillStyle = this.backgroundColor;
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
  }

  /**
   * Clear the offscreen canvas with background color
   */
  clearOffscreen() {
    if (this.offscreenCtx) {
      const ctx = this.offscreenCtx;
      // Reset ALL state that might interfere with clearing
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
      ctx.restore();
    }
  }

  /**
   * Get current π value based on mode
   * @returns {number}
   */
  get piValue() {
    return this.mode === MODE.RATIONAL ? CONFIG.rationalPi : Math.PI;
  }

  /**
   * Check if center should wander (chaos mode)
   * @returns {boolean}
   */
  get isChaosMode() {
    return this.mode === MODE.CHAOS;
  }

  update(dt) {
    super.update(dt);

    if (!this.isAnimating) return;

    // Update time
    this.time += CONFIG.timeStep;

    // Update center position (wanders in chaos mode)
    if (this.isChaosMode) {
      // Lissajous curve with irrational frequencies - center never returns!
      this.centerX = this.baseCenterX + 
        Math.sin(this.time * CONFIG.wanderFreqX) * this.wanderRadius;
      this.centerY = this.baseCenterY + 
        Math.sin(this.time * CONFIG.wanderFreqY) * this.wanderRadius;
    } else {
      this.centerX = this.baseCenterX;
      this.centerY = this.baseCenterY;
    }

    // Calculate hues for this frame
    const hue1 = (this.time * CONFIG.hueSpeed1) % 360;
    const hue2 = (this.time * CONFIG.hueSpeed2) % 360;
    const hue3 = (this.time * CONFIG.hueSpeed3) % 360;
    const hues = [hue1, hue2, hue3];

    // Update each circle
    this.circles.forEach((circle, i) => {
      circle.update(
        this.time,
        this.piValue,
        this.centerX,
        this.centerY,
        hues[i]
      );
    });

    // Periodically bake older path segments to offscreen canvas
    this.frameCount++;
    if (this.frameCount % CONFIG.bakeInterval === 0) {
      this.bakeTrails();
    }
  }

  /**
   * Bake older trail segments to offscreen canvas
   * This is the key performance optimization
   */
  bakeTrails() {
    const ctx = this.offscreenCtx;

    // Apply fade to existing baked content (simulates trail decay)
    ctx.fillStyle = 'rgba(5, 0, 15, 0.02)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Bake each circle's old points with glow
    this.circles.forEach((circle) => {
      const pointsToBake = circle.extractPointsToBake();
      if (pointsToBake.length < 2) return;

      // Draw baked segment with glow (simplified but still glowy)
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Glow layer
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsla(${pointsToBake[0].hue}, 100%, 60%, 0.6)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pointsToBake[0].x, pointsToBake[0].y);

      for (let i = 1; i < pointsToBake.length; i++) {
        ctx.lineTo(pointsToBake[i].x, pointsToBake[i].y);
      }
      ctx.strokeStyle = `hsla(${pointsToBake[pointsToBake.length - 1].hue}, 100%, 55%, 0.6)`;
      ctx.stroke();

      // Core line (brighter)
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pointsToBake[0].x, pointsToBake[0].y);
      for (let i = 1; i < pointsToBake.length; i++) {
        ctx.lineTo(pointsToBake[i].x, pointsToBake[i].y);
      }
      ctx.strokeStyle = `hsla(${pointsToBake[pointsToBake.length - 1].hue}, 100%, 65%, 0.8)`;
      ctx.stroke();
    });
  }

  render() {
    // Draw baked trails from offscreen canvas as the background
    if (this.offscreenCanvas) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    } else {
      Painter.shapes.rect(0, 0, this.width, this.height, this.backgroundColor);
    }

    // Draw only active (recent) paths with full effects
    this.circles.forEach((circle) => {
      this.renderCirclePath(circle);
      this.renderCircleGeometry(circle);
      this.renderTracingPoint(circle);
    });

    // Reset shadow for text
    Painter.effects.clearShadow();

    // Render UI text
    this.renderUI();
  }

  /**
   * Render the trail path for a circle
   * @param {SpiroCircle} circle
   */
  renderCirclePath(circle) {
    const ctx = this.ctx;
    const path = circle.path;

    if (path.length < 2) return;

    // Multiple glow layers
    CONFIG.glowLayers.forEach((blur) => {
      Painter.effects.dropShadow(`hsla(${circle.hue}, 100%, 60%, 0.4)`, blur);
      Painter.colors.stroke(`hsla(${circle.hue}, 100%, ${50 + blur}%, 0.3)`, 3);
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);

      for (let i = 1; i < path.length; i++) {
        const alpha = i / path.length;
        const hueShift = (path[i].hue + alpha * 30) % 360;
        ctx.strokeStyle = `hsla(${hueShift}, 100%, ${50 + alpha * 30}%, ${alpha * 0.6})`;
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });

    Painter.effects.clearShadow();

    // Solid core line
    Painter.colors.stroke(`hsla(${circle.hue}, 100%, 70%, 0.9)`, 2);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
  }

  /**
   * Render the circle geometry (guide circles and connecting lines)
   * @param {SpiroCircle} circle
   */
  renderCircleGeometry(circle) {
    // Draw circles with glow
    Painter.effects.dropShadow(`hsla(${circle.hue}, 100%, 60%, 0.5)`, 30);

    // Inner circle
    Painter.shapes.strokeCircle(
      circle.cx1, circle.cy1, circle.innerR,
      `hsla(${circle.hue}, 80%, 60%, 0.2)`, 2
    );

    // Trace circle
    Painter.shapes.strokeCircle(
      circle.cx2, circle.cy2, circle.traceR,
      `hsla(${circle.hue}, 80%, 60%, 0.2)`, 2
    );

    // Connecting lines
    Painter.effects.dropShadow(`hsla(${circle.hue}, 100%, 60%, 0.5)`, 15);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(circle.cx1, circle.cy1);
    ctx.lineTo(circle.cx2, circle.cy2);
    ctx.lineTo(circle.px, circle.py);
    Painter.colors.stroke(`hsla(${circle.hue}, 70%, 60%, 0.15)`, 1);
  }

  /**
   * Render the glowing tracing point
   * @param {SpiroCircle} circle
   */
  renderTracingPoint(circle) {
    // Radial gradient for glow (x0, y0, r0, x1, y1, r1, stops)
    const gradient = Painter.colors.radialGradient(
      circle.px, circle.py, 0,
      circle.px, circle.py, 15,
      [
        { offset: 0, color: `hsla(${circle.hue}, 100%, 80%, 1)` },
        { offset: 0.5, color: `hsla(${circle.hue}, 100%, 60%, 0.6)` },
        { offset: 1, color: `hsla(${circle.hue}, 100%, 40%, 0)` },
      ]
    );

    Painter.effects.dropShadow(`hsla(${circle.hue}, 100%, 60%, 0.8)`, 25);
    // fillCircle takes (x, y, radius, color) - pass gradient as color
    Painter.shapes.fillCircle(circle.px, circle.py, 15, gradient);
  }

  /**
   * Get mode label for UI
   * @returns {string}
   */
  getModeLabel() {
    switch (this.mode) {
      case MODE.RATIONAL:
        return 'n = 3.14';
      case MODE.CHAOS:
        return 'n = π + drift';
      default:
        return 'n = π';
    }
  }

  /**
   * Render UI text overlays
   */
  renderUI() {
    const fontSize = 12 * this.scale;
    const fontLarge = 16 * this.scale;
    const font = `${fontSize}px monospace`;
    const fontL = `${fontLarge}px monospace`;

    // Info text - fillText(text, x, y, color, font)
    Painter.text.fillText(this.getModeLabel(), 20, 30, 'rgba(255, 255, 255, 0.15)', font);
    Painter.text.fillText(`θ = ${this.time.toFixed(2)}`, 20, 50, 'rgba(255, 255, 255, 0.15)', font);

    // Conditional messages
    if (
      this.mode === MODE.RATIONAL &&
      this.time > CONFIG.rationalMessageStart &&
      this.time < CONFIG.rationalMessageEnd
    ) {
      Painter.text.fillText('we will meet again', 20, 80, 'rgba(255, 100, 100, 0.3)', fontL);
    }

    if (
      this.mode === MODE.IRRATIONAL &&
      this.time > CONFIG.irrationalMessageStart &&
      this.time < CONFIG.irrationalMessageEnd
    ) {
      Painter.text.fillText('never closing...', 20, 80, 'rgba(100, 200, 255, 0.3)', fontL);
    }

    if (
      this.mode === MODE.CHAOS &&
      this.time > CONFIG.chaosMessageStart &&
      this.time < CONFIG.chaosMessageEnd
    ) {
      Painter.text.fillText('lost in infinity...', 20, 80, 'rgba(255, 150, 255, 0.3)', fontL);
    }
  }
}

/**
 * Create Day 24 visualization
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} Game instance with stop() method
 */
export default function day24(canvas) {
  const game = new PerfectionistNightmare(canvas);
  game.start();

  return {
    stop: () => game.stop(),
    game,
  };
}
