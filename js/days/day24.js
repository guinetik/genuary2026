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

import { Game } from '@guinetik/gcanvas';

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
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    
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
    const ctx = this.ctx;

    // Draw baked trails from offscreen canvas as the background
    if (this.offscreenCanvas) {
      ctx.drawImage(this.offscreenCanvas, 0, 0);
    } else {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw only active (recent) paths with full effects
    this.circles.forEach((circle) => {
      this.renderCirclePath(circle);
      this.renderCircleGeometry(circle);
      this.renderTracingPoint(circle);
    });

    // Reset shadow for text
    ctx.shadowBlur = 0;

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
      ctx.shadowBlur = blur;
      ctx.shadowColor = `hsla(${circle.hue}, 100%, 60%, 0.4)`;
      ctx.strokeStyle = `hsla(${circle.hue}, 100%, ${50 + blur}%, 0.3)`;
      ctx.lineWidth = 3;
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

    ctx.shadowBlur = 0;

    // Solid core line
    ctx.strokeStyle = `hsla(${circle.hue}, 100%, 70%, 0.9)`;
    ctx.lineWidth = 2;
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
    const ctx = this.ctx;

    // Draw circles with glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = `hsla(${circle.hue}, 100%, 60%, 0.5)`;
    ctx.strokeStyle = `hsla(${circle.hue}, 80%, 60%, 0.2)`;
    ctx.lineWidth = 2;

    // Inner circle
    ctx.beginPath();
    ctx.arc(circle.cx1, circle.cy1, circle.innerR, 0, Math.PI * 2);
    ctx.stroke();

    // Trace circle
    ctx.beginPath();
    ctx.arc(circle.cx2, circle.cy2, circle.traceR, 0, Math.PI * 2);
    ctx.stroke();

    // Connecting lines
    ctx.shadowBlur = 15;
    ctx.strokeStyle = `hsla(${circle.hue}, 70%, 60%, 0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.lineTo(circle.cx1, circle.cy1);
    ctx.lineTo(circle.cx2, circle.cy2);
    ctx.lineTo(circle.px, circle.py);
    ctx.stroke();
  }

  /**
   * Render the glowing tracing point
   * @param {SpiroCircle} circle
   */
  renderTracingPoint(circle) {
    const ctx = this.ctx;

    // Radial gradient for glow
    const gradient = ctx.createRadialGradient(
      circle.px,
      circle.py,
      0,
      circle.px,
      circle.py,
      15
    );
    gradient.addColorStop(0, `hsla(${circle.hue}, 100%, 80%, 1)`);
    gradient.addColorStop(0.5, `hsla(${circle.hue}, 100%, 60%, 0.6)`);
    gradient.addColorStop(1, `hsla(${circle.hue}, 100%, 40%, 0)`);

    ctx.shadowBlur = 25;
    ctx.shadowColor = `hsla(${circle.hue}, 100%, 60%, 0.8)`;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(circle.px, circle.py, 6, 0, Math.PI * 2);
    ctx.fill();
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
    const ctx = this.ctx;
    const fontSize = 12 * this.scale;

    // Info text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = `${fontSize}px monospace`;
    ctx.fillText(this.getModeLabel(), 20, 30);
    ctx.fillText(`θ = ${this.time.toFixed(2)}`, 20, 50);

    // Conditional messages
    if (
      this.mode === MODE.RATIONAL &&
      this.time > CONFIG.rationalMessageStart &&
      this.time < CONFIG.rationalMessageEnd
    ) {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
      ctx.font = `${16 * this.scale}px monospace`;
      ctx.fillText('we will meet again', 20, 80);
    }

    if (
      this.mode === MODE.IRRATIONAL &&
      this.time > CONFIG.irrationalMessageStart &&
      this.time < CONFIG.irrationalMessageEnd
    ) {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
      ctx.font = `${16 * this.scale}px monospace`;
      ctx.fillText('never closing...', 20, 80);
    }

    if (
      this.mode === MODE.CHAOS &&
      this.time > CONFIG.chaosMessageStart &&
      this.time < CONFIG.chaosMessageEnd
    ) {
      ctx.fillStyle = 'rgba(255, 150, 255, 0.3)';
      ctx.font = `${16 * this.scale}px monospace`;
      ctx.fillText('lost in infinity...', 20, 80);
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
